"use client";

import { lazy, Suspense } from "react";
import InstancePage from "@/components/instance/InstancePage";
import DashboardContent from "@/components/DashboardContent";
import { useSpaPathname } from "@/hooks/useSpaPathname";

// 管理后台使用动态导入，只有访问 /admin 时才加载
const AdminContent = lazy(() => import("@/components/admin/AdminContent"));

/**
 * Main page component with client-side routing.
 * Fixes React Error #310 by ensuring hooks are called consistently.
 * The routing decision happens before any conditional hooks are called.
 */
export default function Page() {
  const pathname = useSpaPathname();
  
  // Client-side routing for SPA behavior with static export
  const parts = pathname.split("/").filter(Boolean);
  
  // Handle /admin/* routes → 管理后台
  if (parts[0] === "admin") {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">加载管理面板...</div>}>
        <AdminContent />
      </Suspense>
    );
  }

  // Handle /instance/<uuid> routes
  if (parts[0] === "instance" && parts[1]) {
    return <InstancePage uuid={parts[1]} />;
  }
  
  // Default dashboard view
  return <DashboardContent />;
}
