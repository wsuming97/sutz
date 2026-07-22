import * as React from "react";
import { z } from "zod";
import { schema } from "@/components/admin/NodeTable/schema/node";
import { DataTableRefreshContext } from "@/components/admin/NodeTable/schema/DataTableRefreshContext";
import { Trash2, Copy, Download, DollarSign } from "lucide-react";
import { t } from "i18next";
import type { Row } from "@tanstack/react-table";
import { EditDialog } from "./NodeEditDialog";
import {
  Button,
  Checkbox,
  Dialog,
  Flex,
  IconButton,
  SegmentedControl,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { toast } from "sonner";
import { copyToClipboard as performCopy } from "@/utils/copyHelper";

async function removeClient(uuid: string) {
  await fetch(`/api/admin/client/${uuid}/remove`, {
    method: "POST",
  });
}

type InstallOptions = {
  disableWebSsh: boolean;
  disableAutoUpdate: boolean;
  ignoreUnsafeCert: boolean;
  ghproxy: string;
  dir: string;
  serviceName: string;
};

type Platform = "linux" | "windows" | "macos";

export function ActionsCell({ row }: { row: Row<z.infer<typeof schema>> }) {
  const refreshTable = React.useContext(DataTableRefreshContext);
  const [removing, setRemoving] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<Platform>("linux");
  const [installOptions, setInstallOptions] = React.useState<InstallOptions>({
    disableWebSsh: false,
    disableAutoUpdate: false,
    ignoreUnsafeCert: false,
    ghproxy: "",
    dir: "",
    serviceName: "",
  });

  const generateCommand = () => {
    const host = window.location.origin;
    const token = row.original.token;
    let args = ["-e", host, "-t", token];
    // 根据安装选项生成参数
    if (installOptions.disableWebSsh) {
      args.push("--disable-web-ssh");
    }
    if (installOptions.disableAutoUpdate) {
      args.push("--disable-auto-update");
    }
    if (installOptions.ignoreUnsafeCert) {
      args.push("--ignore-unsafe-cert");
    }
    if (installOptions.ghproxy) {
      if (!installOptions.ghproxy.startsWith("http")) {
        installOptions.ghproxy = `http://${installOptions.ghproxy}`;
      }
      args.push(`--install-ghproxy`);
      args.push(installOptions.ghproxy);
    }
    if (installOptions.dir) {
      args.push(`--install-dir`);
      args.push(installOptions.dir);
    }
    if (installOptions.serviceName) {
      args.push(`--install-service-name`);
      args.push(installOptions.serviceName);
    }

    let finalCommand = "";
    switch (selectedPlatform) {
      case "linux":
        finalCommand =
          `wget -qO- https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh | sudo bash -s -- ` +
          args.join(" ");
        break;
      case "windows":
        finalCommand =
          `powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ` +
          `"iwr 'https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.ps1'` +
          ` -UseBasicParsing -OutFile 'install.ps1'; &` +
          ` '.\\install.ps1'`;
        args.forEach((arg) => {
          finalCommand += ` '${arg}'`;
        });
        finalCommand += `"`;
        break;
      case "macos":
        finalCommand =
            `zsh <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) ` +
            args.join(" ");
        break;
    }
    return finalCommand;
  };

  const copyToClipboard = async (text: string) => {
    const success = await performCopy(text);
    if (success) {
      toast.success(t("copy_success", "已复制到剪贴板"));
    } else {
      toast.error(t("copy_failed", "复制失败，请手动选择复制"));
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      <Dialog.Root>
        <Dialog.Trigger>
          <IconButton variant="ghost">
            <Download className="p-1" />
          </IconButton>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>
            {t("admin.nodeTable.installCommand", "一键部署指令")}
          </Dialog.Title>
          <div className="flex flex-col gap-4">
            <SegmentedControl.Root
              value={selectedPlatform}
              onValueChange={(value) => setSelectedPlatform(value as Platform)}
            >
              <SegmentedControl.Item value="linux">Linux</SegmentedControl.Item>
              <SegmentedControl.Item value="windows">
                Windows
              </SegmentedControl.Item>
              <SegmentedControl.Item value="macos">macOS</SegmentedControl.Item>
            </SegmentedControl.Root>

            <Flex direction="column" gap="2">
              <label className="text-base font-bold">
                {t("admin.nodeTable.installOptions", "安装选项")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Flex gap="2">
                  <Checkbox
                    checked={installOptions.disableWebSsh}
                    onCheckedChange={(checked) => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableWebSsh: Boolean(checked),
                      }));
                    }}
                  />
                  <label
                    className="text-sm font-normal"
                    onClick={() => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableWebSsh: !prev.disableWebSsh,
                      }));
                    }}
                  >
                    {t("admin.nodeTable.disableWebSsh", "禁用 WebSSH")}
                  </label>
                </Flex>
                <Flex gap="2">
                  <Checkbox
                    checked={installOptions.disableAutoUpdate}
                    onCheckedChange={(checked) => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableAutoUpdate: Boolean(checked),
                      }));
                    }}
                  ></Checkbox>
                  <label
                    className="text-sm font-normal"
                    onClick={() => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        disableAutoUpdate: !prev.disableAutoUpdate,
                      }));
                    }}
                  >
                    {t("admin.nodeTable.disableAutoUpdate", "禁用自动更新")}
                  </label>
                </Flex>
                <Flex gap="2">
                  <Checkbox
                    checked={installOptions.ignoreUnsafeCert}
                    onCheckedChange={(checked) => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        ignoreUnsafeCert: Boolean(checked),
                      }));
                    }}
                  />
                  <label
                    className="text-sm font-normal"
                    onClick={() => {
                      setInstallOptions((prev) => ({
                        ...prev,
                        ignoreUnsafeCert: !prev.ignoreUnsafeCert,
                      }));
                    }}
                  >
                    {t("admin.nodeTable.ignoreUnsafeCert", "忽略不安全证书")}
                  </label>
                </Flex>
              </div>
              <Flex direction="column" gap="2">
                <label className="text-sm font-bold">
                  {t("admin.nodeTable.ghproxy", "GitHub 代理")}
                </label>
                <TextField.Root
                  placeholder={t(
                    "admin.nodeTable.ghproxy_placeholder",
                    "GitHub 代理，为空则不使用代理"
                  )}
                  onChange={(e) =>
                    setInstallOptions((prev) => ({
                      ...prev,
                      ghproxy: e.target.value,
                    }))
                  }
                ></TextField.Root>
                <label className="text-sm font-bold">
                  {t("admin.nodeTable.install_dir", "安装目录")}
                </label>
                <TextField.Root
                  placeholder={t(
                    "admin.nodeTable.install_dir_placeholder",
                    "安装目录，为空则使用默认目录(/opt/komari-agent)"
                  )}
                  onChange={(e) =>
                    setInstallOptions((prev) => ({
                      ...prev,
                      dir: e.target.value,
                    }))
                  }
                ></TextField.Root>
                <label className="text-sm font-bold">
                  {t("admin.nodeTable.serviceName", "服务名称")}
                </label>
                <TextField.Root
                  placeholder={t(
                    "admin.nodeTable.serviceName_placeholder",
                    "服务名称，为空则使用默认名称(komari-agent)"
                  )}
                  onChange={(e) =>
                    setInstallOptions((prev) => ({
                      ...prev,
                      serviceName: e.target.value,
                    }))
                  }
                ></TextField.Root>
              </Flex>
            </Flex>
            <Flex direction="column" gap="2">
              <label className="text-base font-bold">
                {t("admin.nodeTable.generatedCommand", "生成的指令")}
              </label>
              <div className="relative">
                <TextArea
                  disabled
                  className="w-full"
                  style={{ minHeight: "80px" }}
                  value={generateCommand()}
                />
              </div>
            </Flex>
            <Flex justify="center">
              <Button
                style={{ width: "100%" }}
                onClick={() => copyToClipboard(generateCommand())}
              >
                <Copy size={16} />
                {t("copy")}
              </Button>
            </Flex>
          </div>
        </Dialog.Content>
      </Dialog.Root>
      {/** Edit Button */}
      <EditDialog item={row.original} />
      {/** Edit Money */}
      <PriceDialog item={row.original} />
      {/** Delete Button */}
      <Dialog.Root>
        <Dialog.Trigger>
          <IconButton variant="ghost" color="red" className="text-destructive">
            <Trash2 className="p-1" />
          </IconButton>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>{t("admin.nodeTable.confirmDelete")}</Dialog.Title>
          <Dialog.Description>
            {t("admin.nodeTable.cannotUndo")}
          </Dialog.Description>
          <Flex gap="2" justify={"end"}>
            <Dialog.Close>
              <Button variant="soft">{t("admin.nodeTable.cancel")}</Button>
            </Dialog.Close>
            <Dialog.Trigger>
              <Button
                disabled={removing}
                color="red"
                onClick={async () => {
                  setRemoving(true);
                  await removeClient(row.original.uuid);
                  setRemoving(false);
                  if (refreshTable) refreshTable();
                }}
              >
                {removing
                  ? t("admin.nodeTable.deleting")
                  : t("admin.nodeTable.confirm")}
              </Button>
            </Dialog.Trigger>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

/**
 * PriceDialog：编辑账单对话框
 * 字段：价格、货币、计费周期（天数）、到期时间、自动续费
 */
function PriceDialog({ item }: { item: z.infer<typeof schema> }) {
  const refreshTable = React.useContext(DataTableRefreshContext);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    price: item.price ?? 0,
    currency: (item as any).currency ?? "¥",
    billing_cycle: (item as any).billing_cycle ?? 30,
    expired_at: item.expired_at ?? "",
    auto_renewal: (item as any).auto_renewal ?? false,
  });

  // 打开时同步最新数据
  React.useEffect(() => {
    if (open) {
      setForm({
        price: item.price ?? 0,
        currency: (item as any).currency ?? "¥",
        billing_cycle: (item as any).billing_cycle ?? 30,
        expired_at: item.expired_at ?? "",
        auto_renewal: (item as any).auto_renewal ?? false,
      });
    }
  }, [open, item]);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log("[PriceDialog] Saving form data:", JSON.stringify(form));
      const res = await fetch(`/api/admin/client/${item.uuid}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(t("admin.nodeEdit.saveSuccess", "保存成功"));
        if (refreshTable) refreshTable();
        setOpen(false);
      } else {
        toast.error(t("admin.nodeEdit.saveError", "保存失败"));
      }
    } catch {
      toast.error(t("admin.nodeEdit.saveError", "保存失败"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton variant="ghost">
          <DollarSign className="p-1" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{t("admin.nodeTable.editNodePrice")}</Dialog.Title>
        <div className="flex flex-col gap-4">
          {/* 价格 */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeTable.price", "价格")}
            </label>
            <TextField.Root
              type="number"
              value={String(form.price)}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              placeholder={t("admin.nodeTable.priceTips", "0不显示，-1表示免费")}
              disabled={loading}
            />
            <span className="text-xs text-muted-foreground mt-1">
              {t("admin.nodeTable.priceTips", "0不显示，-1表示免费")}
            </span>
          </div>
          {/* 货币符号 */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeTable.currency", "货币")}
            </label>
            <TextField.Root
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              placeholder="¥"
              disabled={loading}
            />
            <span className="text-xs text-muted-foreground mt-1">
              {t("admin.nodeTable.currencyTips", "¥-人民币，$-美元，€-欧元")}
            </span>
          </div>
          {/* 计费周期 */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeTable.billingCycle", "计费周期")}
            </label>
            <TextField.Root
              type="number"
              value={String(form.billing_cycle)}
              onChange={(e) => setForm((f) => ({ ...f, billing_cycle: Number(e.target.value) }))}
              placeholder="30"
              disabled={loading}
            />
            <span className="text-xs text-muted-foreground mt-1">
              30=月付, 92=季付, 365=年付, -1=一次性
            </span>
          </div>
          {/* 到期时间 */}
          <div>
            <label className="block mb-1 text-sm font-medium text-muted-foreground">
              {t("admin.nodeTable.expiredAt", "到期时间")}
            </label>
            <input
              type="datetime-local"
              className="rt-TextFieldInput rt-reset rt-TextFieldRoot rt-r-size-2 rt-variant-surface w-full"
              value={form.expired_at ? form.expired_at.slice(0, 16) : ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm((f) => ({
                  ...f,
                  expired_at: val ? new Date(val).toISOString() : "",
                }));
              }}
              disabled={loading}
            />
            <Flex gap="2" mt="1">
              <Button
                size="1"
                variant="soft"
                onClick={() => setForm((f) => ({ ...f, expired_at: "" }))}
                disabled={loading}
              >
                {t("admin.nodeTable.setToLongTerm", "设置为长期")}
              </Button>
            </Flex>
          </div>
          {/* 自动续费 */}
          <Flex align="center" gap="2">
            <Checkbox
              checked={form.auto_renewal}
              onCheckedChange={(v) => setForm((f) => ({ ...f, auto_renewal: !!v }))}
              disabled={loading}
            />
            <label className="text-sm">
              {t("admin.nodeTable.autoRenewal", "自动续费")}
            </label>
          </Flex>
          <span className="text-xs text-muted-foreground">
            {t("admin.nodeTable.autoRenewalDescription", "如果服务器过期且当前在线，Komari 将自动将到期时间设置为下个自然月（年）")}
          </span>
        </div>
        <Flex gap="2" align="start" className="mt-4">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? t("admin.nodeEdit.waiting", "等待...") : t("admin.nodeEdit.save", "保存")}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
