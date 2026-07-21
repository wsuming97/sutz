"use client";

import React from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AccountProvider, useAccount } from "@/contexts/AccountContext";
import {
  Badge,
  Button,
  Dialog,
  Flex,
  TextField,
} from "@radix-ui/themes";
import Loading from "@/components/loading";

export default function AccountPage() {
  return (
    <AccountProvider>
      <InnerLayout />
    </AccountProvider>
  );
}

const InnerLayout = () => {
  const { t } = useTranslation();
  const { account, loading, error, refresh } = useAccount();
  const [usernameSaving, setUsernameSaving] = React.useState(false);
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [twoFaLoading, setTwoFaLoading] = React.useState(false);
  const [twoFaQr, setTwoFaQr] = React.useState<string | null>(null);
  const [twoFaSecret, setTwoFaSecret] = React.useState<string | null>(null);

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div className="p-4 text-red-500">{error.message}</div>;
  }

  function handleSubmitUsernameChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameSaving(true);
    const form = event.currentTarget as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    fetch("/api/admin/update/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid: account?.uuid,
        username,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update username");
        return res.json();
      })
      .then(() => {
        toast.success(t("common.updated_successfully", "用户名已更新"));
        refresh();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setUsernameSaving(false));
  }

  function handleSubmitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordSaving(true);
    const form = event.currentTarget as HTMLFormElement;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    fetch("/api/admin/update/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid: account?.uuid,
        password,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update password");
        return res.json();
      })
      .then(() => {
        toast.success(t("common.updated_successfully", "密码已更新"));
        form.reset();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setPasswordSaving(false));
  }

  const generateTwoFa = () => {
    setTwoFaLoading(true);
    fetch("/api/admin/2fa/generate")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setTwoFaQr(data.data.qr_code);
          setTwoFaSecret(data.data.secret);
        } else {
          toast.error(data.message || t("common.error"));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setTwoFaLoading(false));
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("account.title", "账号设置")}</h1>

      {/* 用户名 */}
      <div className="border rounded-lg p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("account.username", "修改用户名")}</h2>
        <form onSubmit={handleSubmitUsernameChange} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              {t("account.current_username", "当前用户名")}
            </label>
            <TextField.Root
              name="username"
              defaultValue={account?.username || ""}
              required
            />
          </div>
          <Flex justify="end">
            <Button disabled={usernameSaving} type="submit">
              {t("common.save", "保存修改")}
            </Button>
          </Flex>
        </form>
      </div>

      {/* 修改密码 */}
      <div className="border rounded-lg p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("account.change_password", "修改密码")}</h2>
        <form onSubmit={handleSubmitPasswordChange} className="flex flex-col gap-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              {t("account.new_password", "新密码")}
            </label>
            <TextField.Root
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          <Flex justify="end">
            <Button disabled={passwordSaving} type="submit">
              {t("common.save", "更新密码")}
            </Button>
          </Flex>
        </form>
      </div>

      {/* 2FA 设置 */}
      <div className="border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{t("account.2fa", "双因素认证 (2FA)")}</h2>
            <p className="text-sm text-muted-foreground">
              {account?.["2fa_enabled"]
                ? t("account.2fa_enabled_desc", "已启用 2FA 认证保护")
                : t("account.2fa_disabled_desc", "使用 Google Authenticator 或 OTP 应用增强账户安全")}
            </p>
          </div>
          <Badge color={account?.["2fa_enabled"] ? "green" : "gray"}>
            {account?.["2fa_enabled"] ? t("common.enabled", "已启用") : t("common.disabled", "未启用")}
          </Badge>
        </div>

        {!account?.["2fa_enabled"] && (
          <Dialog.Root>
            <Dialog.Trigger>
              <Button onClick={generateTwoFa} disabled={twoFaLoading}>
                {t("account.enable_2fa", "绑定 2FA")}
              </Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>{t("account.enable_2fa", "绑定双因素认证")}</Dialog.Title>
              {twoFaQr ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <img src={twoFaQr} alt="2FA QR Code" className="w-48 h-48 border rounded" />
                  <p className="text-xs text-muted-foreground font-mono">{twoFaSecret}</p>
                </div>
              ) : (
                <Loading />
              )}
              <Flex justify="end" mt="4">
                <Dialog.Close>
                  <Button variant="soft">{t("common.close", "关闭")}</Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        )}
      </div>
    </div>
  );
};
