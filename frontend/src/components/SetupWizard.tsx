"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import { Button, TextField, Flex, Text, Card, Heading } from "@radix-ui/themes";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

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

    // 前端校验
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
      // 刷新 publicInfo，让 need_setup 变为 false
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="w-full max-w-md p-8 text-center shadow-xl">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-green-500" />
          </div>
          <Heading size="5" className="mb-2">
            {t("setup.success.title", "🎉 设置完成")}
          </Heading>
          <Text as="p" className="text-muted-foreground">
            {t("setup.success.desc", "管理员账号创建成功，正在跳转到登录页面...")}
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Card className="w-full max-w-md shadow-xl">
        <div className="p-8">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <Heading size="6" className="mb-2">
              {t("setup.title", "初始化设置")}
            </Heading>
            <Text as="p" className="text-muted-foreground text-sm">
              {t("setup.desc", "首次部署，请设置管理员账号和密码")}
            </Text>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              {/* 用户名 */}
              <div>
                <Text as="label" size="2" weight="medium" className="block mb-1.5">
                  {t("setup.username", "管理员用户名")}
                </Text>
                <TextField.Root
                  placeholder={t("setup.usernamePlaceholder", "请输入用户名（至少 3 个字符）")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoFocus
                  autoComplete="username"
                />
              </div>

              {/* 密码 */}
              <div>
                <Text as="label" size="2" weight="medium" className="block mb-1.5">
                  {t("setup.password", "密码")}
                </Text>
                <div className="relative">
                  <TextField.Root
                    type={showPassword ? "text" : "password"}
                    placeholder={t("setup.passwordPlaceholder", "请输入密码（至少 6 个字符）")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 确认密码 */}
              <div>
                <Text as="label" size="2" weight="medium" className="block mb-1.5">
                  {t("setup.confirmPassword", "确认密码")}
                </Text>
                <TextField.Root
                  type={showPassword ? "text" : "password"}
                  placeholder={t("setup.confirmPasswordPlaceholder", "请再次输入密码")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <Text size="2" className="text-red-600 dark:text-red-400">
                    {error}
                  </Text>
                </div>
              )}

              {/* 提交按钮 */}
              <Button
                type="submit"
                size="3"
                disabled={loading || !username.trim() || !password || !confirmPassword}
                className="w-full"
              >
                {loading
                  ? t("setup.submitting", "正在设置...")
                  : t("setup.submit", "完成设置")}
              </Button>
            </Flex>
          </form>

          {/* 底部提示 */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Text as="p" size="1" className="text-muted-foreground text-center">
              {t("setup.hint", "此页面仅在首次部署时出现，设置完成后将自动消失")}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
