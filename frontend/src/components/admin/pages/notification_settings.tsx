"use client";

import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardButton,
  SettingCardLabel,
  SettingCardLongTextInput,
  SettingCardSelect,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { toast } from "sonner";
import Loading from "@/components/loading";
import React from "react";
import { renderProviderInputs } from "@/utils/renderProviders";
import { SquareArrowOutUpRight } from "lucide-react";
import SpaLink from "@/components/SpaLink";

const NotificationSettings = () => {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const [messageDefs, setMessageDefs] = React.useState<any>({});
  const [messageList, setMessageList] = React.useState<string[]>([]);
  const [currentMessageSender, setCurrentMessageSender] = React.useState<string>("");
  const [messageValues, setMessageValues] = React.useState<any>({});
  const [messageLoading, setMessageLoading] = React.useState(false);
  const [messageError, setMessageError] = React.useState("");

  React.useEffect(() => {
    if (loading) return;
    setMessageLoading(true);
    fetch("/api/admin/settings/message-sender")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setMessageDefs(data.data);
          const senders = Object.keys(data.data);
          setMessageList(senders);
          const initialSender =
            settings.notification_method && senders.includes(settings.notification_method)
              ? settings.notification_method
              : "";
          setCurrentMessageSender(initialSender);
        } else {
          setMessageError(data.message || t("settings.notification.provider_fetch_failed", "获取消息提供商失败"));
        }
      })
      .catch(() => setMessageError(t("settings.notification.provider_fetch_failed", "获取消息提供商失败")))
      .finally(() => setMessageLoading(false));
  }, [loading, settings.notification_method, t]);

  React.useEffect(() => {
    if (!currentMessageSender) return;
    setMessageLoading(true);
    fetch(`/api/admin/settings/message-sender?provider=${currentMessageSender}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          try {
            setMessageValues(JSON.parse(data.data.addition || "{}"));
          } catch {
            setMessageValues({});
          }
        } else {
          setMessageError(data.message || t("settings.notification.provider_settings_fetch_failed", "获取设置失败"));
        }
      })
      .catch(() => setMessageError(t("settings.notification.provider_settings_fetch_failed", "获取设置失败")))
      .finally(() => setMessageLoading(false));
  }, [currentMessageSender, t]);

  const handleMessageSave = async (values: any) => {
    setMessageLoading(true);
    setMessageError("");
    const body = {
      name: currentMessageSender,
      addition: JSON.stringify(values),
    };
    try {
      const res = await fetch("/api/admin/settings/message-sender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status !== "success") {
        throw new Error(data.message || t("common.error", "错误"));
      } else {
        setMessageValues(values);
      }
      toast.success(t("common.success", "成功"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
    setMessageLoading(false);
  };

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingCardLabel>{t("settings.notification.title", "通知设置")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.notification.enable", "启用通知")}
        description={t("settings.notification.enable_description", "全局开启告警与消息推送")}
        defaultChecked={settings.notification_enabled}
        onChange={async (checked) => {
          await updateSettingsWithToast({ notification_enabled: checked }, t);
        }}
      />
      <SettingCardLongTextInput
        title={t("settings.notification.template", "通知模板")}
        description={t("settings.notification.template_description", "自定义消息推送格式")}
        defaultValue={settings.notification_template}
        OnSave={async (value) => {
          await updateSettingsWithToast({ notification_template: value }, t);
        }}
      />
      <SettingCardSelect
        title={t("settings.notification.method", "推送通道")}
        description={t("settings.notification.method_description", "选择消息发送的渠道")}
        options={messageList.map((sender) => ({ value: sender, label: sender }))}
        value={currentMessageSender}
        OnSave={async (val: string) => {
          if (val === currentMessageSender) return;
          await updateSettingsWithToast({ notification_method: val }, t);
          setCurrentMessageSender(val);
        }}
      />
      {messageLoading ? <Loading /> : renderProviderInputs({
        currentProvider: currentMessageSender,
        providerDefs: messageDefs,
        providerValues: messageValues,
        translationPrefix: `settings.notification.${currentMessageSender}`,
        title: t("settings.notification.provider_fields", "通道配置"),
        description: t("settings.notification.provider_fields_description", "填写通道参数"),
        setProviderValues: setMessageValues,
        handleSave: handleMessageSave,
        t,
      })}
      <SettingCardButton
        title={t("settings.notification.test_title", "发送测试消息")}
        description={t("settings.notification.test_description", "测试当前通道配置")}
        onClick={async () => {
          try {
            const res = await fetch("/api/admin/test/sendMessage", {
              method: "POST",
            });
            let data;
            try {
              data = await res.json();
            } catch {
              toast.error(t("common.error", "错误"));
              return;
            }
            if (data && data.message && data.code !== 200) {
              toast.error(data.message);
              return;
            }
            toast.success(t("common.success", "发送成功"));
          } catch (error) {
            toast.error(
              t("common.error", "发送失败") +
              ": " +
              (error instanceof Error ? error.message : String(error))
            );
          }
        }}
      >
        测试发送
      </SettingCardButton>
      <label className="text-muted-foreground text-sm flex flex-row items-center gap-1">
        {t("settings.notification.moved", "更多具体规则设置")}
        <SpaLink href="/admin/notification/general">
          <SquareArrowOutUpRight size={16} />
        </SpaLink>
      </label>
    </div>
  );
};

export default NotificationSettings;
