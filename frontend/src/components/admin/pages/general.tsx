"use client";

import { useTranslation } from "react-i18next";
import { Button, Code, Flex, Text, TextField } from "@radix-ui/themes";
import {
  updateSettingsWithToast,
  useSettings,
  type SettingsResponse,
} from "@/lib/api";
import {
  SettingCardButton,
  SettingCardCollapse,
  SettingCardLabel,
  SettingCardSelect,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import React from "react";
import { toast } from "sonner";
import Loading from "@/components/loading";

export default function GeneralSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const [geoip_testResult, setGeoipTestResult] = React.useState<string | null>(
    null
  );

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingCardLabel>
        {t("settings.general.auto_discovery", "节点自动发现")}
      </SettingCardLabel>
      <ApiCard settings={settings} />

      <SettingCardLabel>{t("settings.geoip.title", "GeoIP 设置")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.geoip.enable_title", "启用 GeoIP")}
        description={t("settings.geoip.enable_description", "开启 IP 地理位置解析")}
        defaultChecked={settings.geo_ip_enabled}
        onChange={async (checked) => {
          await updateSettingsWithToast({ geo_ip_enabled: checked }, t);
        }}
      />
      <SettingCardSelect
        title={t("settings.geoip.provider_title", "GeoIP 服务商")}
        description={t("settings.geoip.provider_description", "选择地理位置解析提供商")}
        defaultValue={settings.geo_ip_provider || "empty"}
        options={[
          { value: "empty", label: t("common.none", "无") },
          { value: "mmdb", label: "MaxMind" },
          { value: "ip-api", label: "ip-api.com" },
          { value: "geojs", label: "geojs.io" },
          { value: "ipinfo", label: "ipinfo.io" },
        ]}
        OnSave={async (value) => {
          await updateSettingsWithToast({ geo_ip_provider: value }, t);
        }}
      />
      <SettingCardButton
        title={t("settings.geoip.update_title", "更新 IP 数据库")}
        onClick={async () => {
          const result = await fetch("/api/admin/update/mmdb", {
            method: "POST",
          });
          const data = await result.json();
          if (data.status === "success") {
            toast.success(t("settings.geoip.update_success", "更新成功"));
          } else {
            toast.error(
              data.message || t("settings.geoip.update_error", "更新失败")
            );
          }
        }}
      >
        {t("common.update", "更新")}
      </SettingCardButton>
      <SettingCardCollapse
        title={t("settings.geoip.test_title", "测试 GeoIP")}
        description={t("settings.geoip.test_description", "输入 IP 地址测试解析结果")}
      >
        <Flex className="w-full gap-2" direction="column">
          <TextField.Root id="geoip-test-input" placeholder="1.1.1.1 or 2606:4700:4700::1111" />
          <div>
            <Button
              variant="solid"
              onClick={async () => {
                const el = document.getElementById("geoip-test-input") as HTMLInputElement;
                const ip = el?.value || "";
                const result = await fetch(`/api/admin/test/geoip?ip=${ip}`);
                const data = await result.json();
                setGeoipTestResult(
                  JSON.stringify(data.data, null, 2) || t("common.no_results", "无结果")
                );
              }}
            >
              {t("settings.geoip.test_button", "测试")}
            </Button>
          </div>
          <Flex className="w-full">
            {geoip_testResult && (
              <Code
                className="w-full whitespace-pre-wrap text-sm p-3 rounded-md overflow-auto max-h-96"
                style={{ display: "block" }}
              >
                {geoip_testResult}
              </Code>
            )}
          </Flex>
        </Flex>
      </SettingCardCollapse>
    </div>
  );
}

const ApiCard = ({ settings }: { settings: SettingsResponse }) => {
  const { t } = useTranslation();
  const [apiValues, setApiValues] = React.useState<string>(
    settings?.auto_discovery_key || ""
  );

  const generateRandomString = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateApiKey = () => {
    const newApiKey = generateRandomString();
    setApiValues(newApiKey);
  };

  React.useEffect(() => {
    if (settings?.auto_discovery_key) {
      setApiValues(settings.auto_discovery_key);
    }
  }, [settings?.auto_discovery_key]);

  return (
    <SettingCardShortTextInput
      title={t("settings.general.auto_discovery_key", "自动发现 API Key")}
      description={t("settings.general.auto_discovery_key_description", "客户端注册时使用的密钥")}
      value={apiValues}
      onChange={(e) => setApiValues(e.target.value)}
      OnSave={async (values) => {
        if (!values) {
          await updateSettingsWithToast({ auto_discovery_key: "" }, t);
          return;
        }
        if (values.length < 12) {
          toast.error(t("settings.api.key_length_error", "Key 长度至少为 12 个字符"));
          return;
        }
        await updateSettingsWithToast({ auto_discovery_key: values }, t);
      }}
    >
      <div className="flex flex-row gap-2 justify-start items-center">
        <Button variant="soft" color="green" onClick={handleGenerateApiKey}>
          {t("common.generate", "随机生成")}
        </Button>
      </div>
    </SettingCardShortTextInput>
  );
};
