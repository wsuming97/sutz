"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "github-markdown-css/github-markdown.css";
import Loading from "@/components/loading";
import { useTranslation } from "react-i18next";
import { SquareArrowOutUpRight } from "lucide-react";
import { SegmentedControl } from "@radix-ui/themes";
import { Apache2_LICENSE, Eula, MIT_LICENSE } from "@/utils/field";
import { SettingCardCollapse } from "@/components/admin/SettingCard";

export default function AboutPage() {
  const [markdown, setMarkdown] = useState("");
  const { t } = useTranslation();
  const [view, setView] = useState("open_source");

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/komari-monitor/komari/refs/heads/main/README.md"
    )
      .then((res) => res.text())
      .then(setMarkdown)
      .catch(() => setMarkdown("### Komari Server Monitor\n\n高效、简洁的轻量级服务器监控面板。"));
  }, []);

  const open_source_licenses = {
    "MIT License": [
      "@dnd-kit/core",
      "@dnd-kit/modifiers",
      "@dnd-kit/sortable",
      "@radix-ui/react-dialog",
      "@radix-ui/themes",
      "@tanstack/react-table",
      "i18next",
      "lucide-react",
      "motion",
      "next",
      "react",
      "sonner",
      "tailwindcss",
    ],
    "Apache-2.0 License": [
      "github.com/gin-gonic/gin",
      "gorm.io/gorm",
    ],
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-foreground">{t("about.title", "关于项目")}</h1>
      <SegmentedControl.Root value={view} onValueChange={setView}>
        <SegmentedControl.Item value="open_source">
          {t("about.open_source_title", "开源许可与声明")}
        </SegmentedControl.Item>
        <SegmentedControl.Item value="eula">
          法律声明与合规指引
        </SegmentedControl.Item>
        <SegmentedControl.Item value="readme">README</SegmentedControl.Item>
      </SegmentedControl.Root>

      {(() => {
        switch (view) {
          case "eula":
            return (
              <div className="license-text mb-4 p-4 border rounded-md bg-accent-1 flex flex-col gap-2">
                <pre className="text-wrap text-xs font-mono">{Eula}</pre>
              </div>
            );
          case "open_source":
            return (
              <div className="flex flex-col gap-4">
                <SettingCardCollapse
                  title="MIT License"
                  description="Copyright (C) 2025 Komari Monitor"
                >
                  <pre className="text-wrap text-xs font-mono">{MIT_LICENSE}</pre>
                </SettingCardCollapse>
                <SettingCardCollapse
                  title="Apache License"
                  description="Version 2.0, January 2004"
                >
                  <pre className="text-wrap text-xs font-mono">{Apache2_LICENSE}</pre>
                </SettingCardCollapse>
                <h2 className="text-xl font-semibold text-foreground">
                  {t("about.open_source", "使用到的开源组件")}
                </h2>
                <div className="copyright text-sm text-gray-500">
                  {Object.entries(open_source_licenses).map(([license, libs]) => (
                    <div key={license} className="mb-2">
                      <h3 className="font-bold text-base text-foreground">
                        {license}
                      </h3>
                      <ul className="list-disc list-inside">
                        {libs.map((lib) => (
                          <li key={lib}>{lib}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          case "readme":
            return (
              <div className="flex flex-col gap-2">
                <div className="markdown-body border border-muted/20 rounded-md p-4">
                  {markdown ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {markdown}
                    </ReactMarkdown>
                  ) : (
                    <Loading />
                  )}
                </div>
                <a
                  href="https://github.com/komari-monitor/komari/blob/main/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-row gap-2 text-sm items-center text-blue-500 hover:underline"
                >
                  {t("about.readme_open_in_new_tab", "在 GitHub 查看完整 README")}
                  <SquareArrowOutUpRight size="16" />
                </a>
              </div>
            );
        }
      })()}
    </div>
  );
}
