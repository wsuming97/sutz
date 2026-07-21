"use client";

/**
 * LayoutContent：根据当前路径决定是否显示前台导航栏和 main 容器。
 * /admin 路径下管理面板有自己的全屏布局和导航栏，不需要前台的。
 */

import React from "react";
import NavBar from "@/components/NavBar";
import RemainingValueCalculator from "@/components/RemainingValueCalculator";
import { useSpaPathname } from "@/hooks/useSpaPathname";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = useSpaPathname();
  const isAdmin = pathname.startsWith("/admin");

  // 管理后台：不渲染前台 NavBar 和 main 包裹，由 AdminPanelBar 自行管理布局
  if (isAdmin) {
    return <>{children}</>;
  }

  // 前台页面：正常渲染 NavBar + main 容器
  return (
    <>
      <NavBar />
      <main className="flex-1 py-4 md:py-12">
        {children}
      </main>
      <RemainingValueCalculator />
    </>
  );
}
