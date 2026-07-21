"use client";

/**
 * 管理后台内容路由器
 * 根据 SPA pathname 渲染对应的管理子页面
 * 
 * 路由映射：
 * /admin              → 服务器列表（NodeTable）
 * /admin/settings/*   → 设置页（通过 RPC2 动态加载）
 * /admin/notification/* → 通知设置
 * /admin/exec         → 命令执行
 * /admin/ping         → Ping 任务
 * /admin/sessions     → 会话管理
 * /admin/account      → 账号设置
 * /admin/logs         → 日志
 * /admin/about        → 关于
 */

import React, { lazy, Suspense } from "react";
import { useSpaPathname } from "@/hooks/useSpaPathname";
import AdminPanelBar from "@/components/admin/AdminPanelBar";
import { NodeDetailsProvider } from "@/contexts/NodeDetailsContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LoadAlertProvider } from "@/contexts/LoadAlertContext";
import { CommandClipboardProvider } from "@/contexts/CommandClipboardContext";
import { PingTaskProvider } from "@/contexts/PingTaskContext";

// 懒加载管理页面组件
const NodeTable = lazy(() => import("@/components/admin/NodeTable"));

/**
 * AdminContent：根据当前 SPA 路径渲染对应的管理后台内容
 */
function AdminContent() {
  const pathname = useSpaPathname();

  // 根据路径渲染对应内容
  // 目前只有 NodeTable（服务器列表）是完整实现的
  // 其他页面后续按需开发
  const renderContent = () => {
    // /admin 或 /admin/ → 服务器列表
    if (pathname === "/admin" || pathname === "/admin/") {
      return (
        <Suspense fallback={<div className="p-4 text-muted-foreground">加载中...</div>}>
          <NodeDetailsProvider>
            <NodeTable />
          </NodeDetailsProvider>
        </Suspense>
      );
    }

    // /admin/settings/* → 设置页面（使用 RPC2 接口）
    if (pathname.startsWith("/admin/settings")) {
      return (
        <div className="p-4 text-muted-foreground">
          设置页面 - 开发中
        </div>
      );
    }

    // /admin/notification/* → 通知设置
    if (pathname.startsWith("/admin/notification")) {
      return (
        <NotificationProvider>
          <LoadAlertProvider>
            <div className="p-4 text-muted-foreground">
              通知设置页面 - 开发中
            </div>
          </LoadAlertProvider>
        </NotificationProvider>
      );
    }

    // /admin/exec → 命令执行
    if (pathname === "/admin/exec") {
      return (
        <CommandClipboardProvider>
          <div className="p-4 text-muted-foreground">
            命令执行页面 - 开发中
          </div>
        </CommandClipboardProvider>
      );
    }

    // /admin/ping → Ping 任务
    if (pathname === "/admin/ping") {
      return (
        <PingTaskProvider>
          <div className="p-4 text-muted-foreground">
            Ping 任务页面 - 开发中
          </div>
        </PingTaskProvider>
      );
    }

    // 其他 admin 子页面暂时显示开发中
    return (
      <div className="p-4 text-muted-foreground">
        页面开发中...
      </div>
    );
  };

  return (
    <AdminPanelBar content={renderContent()} />
  );
}

export default AdminContent;
