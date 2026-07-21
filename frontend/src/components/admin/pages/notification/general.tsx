"use client";

import { Flex, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import Loading from "@/components/loading";
import {
  SettingCardLabel,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { toast } from "sonner";

export default function GeneralNotificationPage() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <SettingCardLabel>
        {t("admin.notification.expire_title", "到期提醒")}
      </SettingCardLabel>
      <SettingCardSwitch
        defaultChecked={settings.expire_notification_enabled}
        title={t("admin.notification.expire_enable", "开启服务器到期提醒")}
        description={t("admin.notification.expire_enable_description", "在服务器即将到期前发送通知")}
        onChange={async (checked) => {
          await updateSettingsWithToast(
            { expire_notification_enabled: checked },
            t
          );
        }}
      />
      <SettingCardShortTextInput
        type="number"
        title={t("admin.notification.expire_time", "提前提醒天数")}
        description={t("admin.notification.expire_time_description", "提前 N 天开始推送到期通知")}
        defaultValue={settings.expire_notification_lead_days || 7}
        OnSave={async (value) => {
          const numValue = Number(value);
          if (isNaN(numValue) || numValue < 0) {
            toast.error("请输入非负整数");
            return;
          }
          await updateSettingsWithToast(
            { expire_notification_lead_days: numValue },
            t
          );
        }}
      />

      <SettingCardLabel>{t("admin.notification.login", "登录提醒")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("admin.notification.login", "后台登录通知")}
        description={t("admin.notification.login_description", "每当有新设备/IP 登录后台时发送告警")}
        defaultChecked={settings.login_notification}
        onChange={async (checked) => {
          await updateSettingsWithToast(
            { login_notification: checked },
            t
          );
        }}
      />

      <SettingCardLabel>{t("admin.notification.traffic", "流量限额提醒")}</SettingCardLabel>
      <SettingCardShortTextInput
        title={t("admin.notification.traffic", "流量预警百分比 (%)")}
        description={t("admin.notification.traffic_description", "当当月使用流量达到预设比例时触发通知")}
        defaultValue={settings.traffic_limit_percentage || 80}
        type="number"
        OnSave={async (value) => {
          await updateSettingsWithToast(
            { traffic_limit_percentage: Number(value) },
            t
          );
        }}
      />
    </div>
  );
}
