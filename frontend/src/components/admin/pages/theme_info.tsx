"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Palette, Sparkles } from "lucide-react";
import { SettingCardLabel } from "@/components/admin/SettingCard";

export default function ThemeInfoPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl">
      <SettingCardLabel>{t("theme.title", "主题外观设置")}</SettingCardLabel>
      <div className="border rounded-xl p-6 bg-card flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Palette size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {t("themeCustomizer.title", "实时主题自定义")}
            </h2>
            <p className="text-sm text-muted-foreground">
              Komari 提供了强大而活泼的实时外观定制引擎。
            </p>
          </div>
        </div>

        <div className="text-sm space-y-2 border-t pt-4 text-muted-foreground">
          <p className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            您可以随时点击页面右上角导航栏中的 <strong>调色板图标（Theme Switcher）</strong> 打开实时配置面板。
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
            <li>配色方案（默认 / 紫罗兰 / 极光绿 / 珊瑚粉 / 极夜黑等）</li>
            <li>节点卡片布局（经典网格 / 极简压缩列表 / Modern 流线版）</li>
            <li>组件设计形态与图表平滑度</li>
            <li>自定义背景图片、高斯模糊与暗度遮罩</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
