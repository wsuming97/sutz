"use client";

import {
  SettingCardLabel,
  SettingCardSelect,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import { Button, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import Loading from "@/components/loading";
import React from "react";
import { renderProviderInputs } from "@/utils/renderProviders";
import { toast } from "sonner";

export default function SignOnSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const [providerDefs, setProviderDefs] = React.useState<any>({});
  const [providerList, setProviderList] = React.useState<string[]>([]);
  const [currentProvider, setCurrentProvider] = React.useState<string>("");
  const [providerValues, setProviderValues] = React.useState<any>({});
  const [providerLoading, setProviderLoading] = React.useState(false);
  const [providerError, setProviderError] = React.useState("");

  React.useEffect(() => {
    if (loading) return;
    setProviderLoading(true);
    fetch("/api/admin/settings/oidc")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setProviderDefs(data.data);
          const providers = Object.keys(data.data);
          setProviderList(providers);
          const initialProvider =
            settings.o_auth_provider && providers.includes(settings.o_auth_provider)
              ? settings.o_auth_provider
              : "";
          setCurrentProvider(initialProvider);
        } else {
          setProviderError(data.message || t("settings.sso.provider_fetch_failed", "获取 SSO 提供商失败"));
        }
      })
      .catch(() => setProviderError(t("settings.sso.provider_fetch_failed", "获取 SSO 提供商失败")))
      .finally(() => setProviderLoading(false));
  }, [loading, settings.o_auth_provider, t]);

  React.useEffect(() => {
    if (!currentProvider) return;
    setProviderLoading(true);
    fetch(`/api/admin/settings/oidc?provider=${currentProvider}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          try {
            setProviderValues(JSON.parse(data.data.addition || "{}"));
          } catch {
            setProviderValues({});
          }
        } else {
          setProviderError(data.message || t("settings.sso.provider_settings_fetch_failed", "获取设置失败"));
        }
      })
      .catch(() => setProviderError(t("settings.sso.provider_settings_fetch_failed", "获取设置失败")))
      .finally(() => setProviderLoading(false));
  }, [currentProvider, t]);

  const handleOidcSave = async (values: any) => {
    setProviderLoading(true);
    setProviderError("");
    const body = {
      name: currentProvider,
      addition: JSON.stringify(values),
    };
    try {
      const res = await fetch("/api/admin/settings/oidc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status !== "success") {
        setProviderError(data.message || t("settings.sso.provider_save_failed", "保存失败"));
      } else {
        setProviderValues(values);
        toast.success(t("common.saved_successfully", "保存成功"));
      }
    } catch {
      setProviderError(t("settings.sso.provider_save_failed", "保存失败"));
    }
    setProviderLoading(false);
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingCardLabel>{t("settings.sign_on.title", "登录方式设置")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.sign_on.disable_password", "禁用密码登录")}
        defaultChecked={settings.disable_password_login}
        onChange={async (checked) => {
          await updateSettingsWithToast({ disable_password_login: checked }, t);
        }}
      />
      <SettingCardLabel>{t("settings.sso.title", "SSO 单点登录")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.sso.enable", "启用 SSO")}
        defaultChecked={settings.o_auth_enabled}
        description={t("settings.sso.enable_description", "开启 OAuth/OIDC 登录方式")}
        onChange={async (checked) => {
          await updateSettingsWithToast({ o_auth_enabled: checked }, t);
        }}
      />
      <SettingCardSelect
        title={String(t("settings.sso.provider", "SSO 提供商"))}
        description={String(t("settings.sso.provider_description", "选择用于单点登录的服务商"))}
        options={providerList.map((p) => ({ value: p, label: p }))}
        value={currentProvider}
        OnSave={async (val: string) => {
          if (val === currentProvider) return;
          await updateSettingsWithToast({ o_auth_provider: val }, t);
          setCurrentProvider(val);
        }}
      />
      {providerLoading ? <Loading /> : renderProviderInputs({
        currentProvider,
        providerDefs,
        providerValues,
        translationPrefix: "settings.sso." + currentProvider,
        title: t("settings.sso.provider_fields", "提供商配置"),
        description: t("settings.sso.provider_fields_description", "填写服务商鉴权客户端参数"),
        footer: t("settings.sso.callback_url_tips", { url: typeof window !== "undefined" ? `${window.location.origin}/api/oauth_callback` : "" }),
        setProviderValues,
        handleSave: handleOidcSave,
        t,
      })}
      <SettingCardLabel>API Key</SettingCardLabel>
      <ApiCard />
    </div>
  );
}

const ApiCard = () => {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [apiValues, setApiValues] = React.useState<string>(settings?.api_key || "");

  const generateRandomString = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'komari-';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateApiKey = () => {
    const newApiKey = generateRandomString();
    setApiValues(newApiKey);
  };

  React.useEffect(() => {
    if (settings?.api_key) {
      setApiValues(settings.api_key);
    }
  }, [settings?.api_key]);

  return (
    <SettingCardShortTextInput
      title={t("settings.api.title", "全局 API Key")}
      description={t("settings.api.description", "用于外部系统的 API 鉴权")}
      value={apiValues}
      onChange={(e) => setApiValues(e.target.value)}
      OnSave={async (values) => {
        if (!values) {
          await updateSettingsWithToast({ api_key: "" }, t);
          return;
        }
        if (values.length < 12) {
          toast.error(t("settings.api.key_length_error", "Key 长度至少为 12 个字符"));
          return;
        }
        await updateSettingsWithToast({ api_key: values }, t);
      }}
    >
      <div className="flex flex-row gap-2 justify-start items-center">
        <Button variant="soft" color="green" onClick={handleGenerateApiKey}>{t('common.generate', '随机生成')}</Button>
      </div>
    </SettingCardShortTextInput>
  );
};
