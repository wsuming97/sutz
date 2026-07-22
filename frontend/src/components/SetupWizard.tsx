"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldCheck, Eye, EyeOff, Lock, User, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

/**
 * SetupWizard — 首次部署 Web 端初始化组件。
 * 当 publicInfo.need_setup === true 时显示，引导用户设置管理员账号密码。
 * 设置完成后自动刷新 publicInfo，setup 接口自动失效。
 */
export default function SetupWizard() {
  const { t } = useTranslation();
  const { refresh } = usePublicInfo();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError(t("setup.error.usernameMin", "用户名至少 3 个字符"));
      return;
    }
    if (password.length < 6) {
      setError(t("setup.error.passwordMin", "密码至少 6 个字符"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("setup.error.passwordMismatch", "两次输入的密码不一致"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        setError(data.message || t("setup.error.failed", "设置失败"));
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        refresh();
      }, 1500);
    } catch (err) {
      setError(t("setup.error.network", "网络错误，请重试"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50 dark:bg-gray-950">
        <Card className="w-full max-w-md p-6 text-center shadow-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {t("setup.success.title", "🎉 设置完成")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("setup.success.desc", "管理员账号创建成功，正在跳转到控制面板...")}
          </p>
        </Card>
      </div>
    );
  }

  const isFormValid = username.trim().length >= 3 && password.length >= 6 && password === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 shadow-inner">
              <ShieldCheck className="h-9 w-9" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {t("setup.title", "初始化设置")}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("setup.desc", "首次部署，请设置管理员账号和密码")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {t("setup.username", "管理员用户名")}
              </label>
              <Input
                type="text"
                placeholder={t("setup.usernamePlaceholder", "请输入用户名（至少 3 个字符）")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="username"
                className="h-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              />
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                {t("setup.password", "密码")}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("setup.passwordPlaceholder", "请输入密码（至少 6 个字符）")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className="h-10 pr-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 确认密码 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                {t("setup.confirmPassword", "确认密码")}
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("setup.confirmPasswordPlaceholder", "请再次输入密码")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="h-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full h-10 mt-2 font-medium bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-md hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("setup.submitting", "正在设置...")}
                </span>
              ) : (
                t("setup.submit", "完成设置")
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-2 pb-6 border-t border-gray-100 dark:border-gray-800/80 justify-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {t("setup.hint", "此页面仅在首次部署时出现，设置完成后将自动消失")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
