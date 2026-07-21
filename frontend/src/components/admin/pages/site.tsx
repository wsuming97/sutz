"use client";

import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/lib/api";
import {
  SettingCardLabel,
  SettingCardLongTextInput,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/components/admin/SettingCard";
import { DatabaseMaintenanceCard } from "@/components/admin/DatabaseMaintenanceCard";
import Loading from "@/components/loading";
import { useState } from "react";
import { toast } from "sonner";

export default function SiteSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingCardLabel>{t("settings.site.title", "站点设置")}</SettingCardLabel>
      <SettingCardShortTextInput
        title={t("settings.site.name", "站点名称")}
        description={t("settings.site.name_description", "控制标题和基础标识")}
        defaultValue={settings.sitename || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ sitename: data }, t);
        }}
      />
      <SettingCardLongTextInput
        title={t("settings.site.description", "站点描述")}
        description={t("settings.site.description_description", "SEO 站点描述信息")}
        defaultValue={settings.description || ""}
        OnSave={async (data) => {
          await updateSettingsWithToast({ description: data }, t);
        }}
      />
      <SettingCardSwitch
        title={t("settings.site.cors_origin_check_enabled", "API CORS 跨域源校验")}
        description={t("settings.site.cors_origin_check_enabled_description", "启用跨域来源防护")}
        defaultChecked={settings.cors_origin_check_enabled ?? true}
        onChange={async (checked) => {
          await updateSettingsWithToast({ cors_origin_check_enabled: checked }, t);
        }}
      />

      <SettingCardLabel>{t("settings.database.title", "数据库维护")}</SettingCardLabel>
      <DatabaseMaintenanceCard />
    </div>
  );
}
