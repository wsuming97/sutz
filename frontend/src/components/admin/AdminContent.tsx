"use client";

/**
 * 管理后台内容路由器
 * 根据 SPA pathname 渲染对应的管理子页面
 */

import React, { lazy, Suspense } from "react";
import { useSpaPathname } from "@/hooks/useSpaPathname";
import AdminPanelBar from "@/components/admin/AdminPanelBar";
import { AccountProvider } from "@/contexts/AccountContext";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

// 懒加载所有管理子页面组件
const NodeTable = lazy(() =>
  import("@/components/admin/NodeTable").then((mod) => ({ default: mod.DataTable }))
);
const SiteSettings = lazy(() => import("@/components/admin/pages/site"));
const ThemeSettings = lazy(() => import("@/components/admin/pages/theme_info"));
const GeneralSettings = lazy(() => import("@/components/admin/pages/general"));
const SignOnSettings = lazy(() => import("@/components/admin/pages/sign-on"));
const NotificationSettings = lazy(() => import("@/components/admin/pages/notification_settings"));
const OfflineNotificationPage = lazy(() => import("@/components/admin/pages/notification/offline"));
const LoadNotificationPage = lazy(() => import("@/components/admin/pages/notification/load"));
const TrafficReportNotificationPage = lazy(() => import("@/components/admin/pages/notification/traffic_report"));
const GeneralNotificationPage = lazy(() => import("@/components/admin/pages/notification/general"));
const PingTaskPage = lazy(() => import("@/components/admin/pages/pingTask"));
const SessionsPage = lazy(() => import("@/components/admin/pages/sessions"));
const AccountPage = lazy(() => import("@/components/admin/pages/account"));
const LogPage = lazy(() => import("@/components/admin/pages/log"));
const AboutPage = lazy(() => import("@/components/admin/pages/about"));

/**
 * AdminContent：根据当前 SPA 路径渲染对应的管理后台内容
 */
function AdminContent() {
  const pathname = useSpaPathname();

  const renderContent = () => {
    // 路由分发逻辑
    switch (pathname) {
      case "/admin":
      case "/admin/":
        return <NodeTable />;

      // 设置子页面
      case "/admin/settings":
      case "/admin/settings/":
      case "/admin/settings/site":
        return <SiteSettings />;
      case "/admin/settings/theme":
        return <ThemeSettings />;
      case "/admin/settings/general":
        return <GeneralSettings />;
      case "/admin/settings/sign-on":
        return <SignOnSettings />;
      case "/admin/settings/notification":
        return <NotificationSettings />;

      // 通知管理
      case "/admin/notification":
      case "/admin/notification/":
      case "/admin/notification/offline":
        return <OfflineNotificationPage />;
      case "/admin/notification/load":
        return <LoadNotificationPage />;
      case "/admin/notification/traffic-report":
      case "/admin/notification/traffic_report":
        return <TrafficReportNotificationPage />;
      case "/admin/notification/general":
        return <GeneralNotificationPage />;

      // 延迟监测 (Ping 任务)
      case "/admin/ping":
      case "/admin/ping/":
        return <PingTaskPage />;

      // 会话管理
      case "/admin/sessions":
      case "/admin/sessions/":
        return <SessionsPage />;

      // 账户设置
      case "/admin/account":
      case "/admin/account/":
        return <AccountPage />;

      // 日志
      case "/admin/logs":
      case "/admin/log":
      case "/admin/logs/":
        return <LogPage />;

      // 关于
      case "/admin/about":
      case "/admin/about/":
        return <AboutPage />;

      default:
        // 前级前流配置匹配
        if (pathname.startsWith("/admin/settings")) return <SiteSettings />;
        if (pathname.startsWith("/admin/notification")) return <OfflineNotificationPage />;
        return <NodeTable />;
    }
  };

  return (
    <Theme>
      <AccountProvider>
        <AdminPanelBar
          content={
            <Suspense fallback={<div className="p-6 text-muted-foreground">加载中...</div>}>
              {renderContent()}
            </Suspense>
          }
        />
      </AccountProvider>
    </Theme>
  );
}

export default AdminContent;
