"use client";

/**
 * 管理后台内容路由器
 * 根据 SPA pathname 渲染对应的管理子页面
 */

import React, { lazy, Suspense } from "react";
import { useSpaPathname } from "@/hooks/useSpaPathname";
import AdminPanelBar from "@/components/admin/AdminPanelBar";

// 懒加载管理页面组件（DataTable 是命名导出，需包装为默认导出）
const NodeTable = lazy(() =>
  import("@/components/admin/NodeTable").then((mod) => ({ default: mod.DataTable }))
);

/**
 * AdminContent：根据当前 SPA 路径渲染对应的管理后台内容
 */
function AdminContent() {
  const pathname = useSpaPathname();

  const renderContent = () => {
    // /admin 或 /admin/ → 服务器列表
    if (pathname === "/admin" || pathname === "/admin/") {
      return (
        <Suspense fallback={<div className="p-4 text-muted-foreground">加载中...</div>}>
          <NodeTable />
        </Suspense>
      );
    }

    // 其他 admin 子页面暂时显示占位
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
