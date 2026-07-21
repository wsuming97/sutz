"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NodeDetailsProvider,
  useNodeDetails,
} from "@/contexts/NodeDetailsContext";
import {
  OfflineNotificationProvider,
  useOfflineNotification,
  type OfflineNotification,
} from "@/contexts/NotificationContext";
import React from "react";
import { Pencil, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Dialog,
  Flex,
  IconButton,
  Switch,
  TextField,
} from "@radix-ui/themes";
import { toast } from "sonner";
import Loading from "@/components/loading";
import Tips from "@/components/ui/tips";

export default function OfflineNotificationPage() {
  return (
    <OfflineNotificationProvider>
      <NodeDetailsProvider>
        <InnerLayout />
      </NodeDetailsProvider>
    </OfflineNotificationProvider>
  );
}

const NotificationEditForm = ({
  initialValues,
  onSubmit,
  loading,
  onCancel,
}: {
  initialValues: { enable: boolean; cooldown: number; grace_period: number };
  onSubmit: (values: {
    enable: boolean;
    cooldown: number;
    grace_period: number;
  }) => void;
  loading?: boolean;
  onCancel?: () => void;
}) => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = React.useState(initialValues.enable);
  const [grace, setGrace] = React.useState(initialValues.grace_period);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ enable: enabled, cooldown: 3000, grace_period: grace });
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="status">{t("common.status", "状态")}</label>
      <Switch
        id="status"
        name="status"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
      <label htmlFor="grace_period" className="flex items-center gap-2">
        {t("notification.offline.grace_period", "离线判定容忍时间(秒)")}
        <Tips>{t("notification.offline.grace_period_tip", "节点离线达到此秒数后触发告警")}</Tips>
      </label>
      <TextField.Root
        type="number"
        min={0}
        value={grace}
        onChange={(e) => setGrace(Number(e.target.value))}
        id="grace_period"
        name="grace_period"
      />
      <Flex gap="2" justify="end" className="mt-4">
        {onCancel && (
          <Dialog.Close>
            <Button
              variant="soft"
              color="gray"
              type="button"
              onClick={onCancel}
            >
              {t("common.cancel", "取消")}
            </Button>
          </Dialog.Close>
        )}
        <Button variant="solid" type="submit" disabled={loading}>
          {t("common.save", "保存")}
        </Button>
      </Flex>
    </form>
  );
};

const InnerLayout = () => {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const {
    loading: onLoading,
    error: onError,
    offlineNotification,
    refresh,
  } = useOfflineNotification();
  const { isLoading: onNodeLoading, error: onNodeError } = useNodeDetails();
  const { t } = useTranslation();
  const [batchLoading, setBatchLoading] = React.useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = React.useState(false);
  const [batchForm, setBatchForm] = React.useState({
    enable: true,
    cooldown: 1800,
    grace_period: 300,
  });

  const handleBatchEdit = (values: {
    enable: boolean;
    cooldown: number;
    grace_period: number;
  }) => {
    setBatchLoading(true);
    const payload = selected.map((id) => ({
      client: id,
      enable: values.enable,
      cooldown: values.cooldown,
      grace_period: values.grace_period,
    }));
    fetch("/api/admin/notification/offline/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to update offline notifications: " + res.statusText);
        } else {
          toast.success(t("common.updated_successfully", "批量更新成功"));
        }
        return res.json();
      })
      .then(() => {
        setBatchLoading(false);
        setBatchDialogOpen(false);
        refresh();
      })
      .catch((error) => {
        console.error("Error updating offline notifications:", error);
        toast.error(error.message);
        setBatchLoading(false);
      });
  };

  if (onLoading || onNodeLoading) {
    return <Loading />;
  }
  if (onError || onNodeError) {
    return <div className="p-4 text-red-500">Error: {onError?.message || onNodeError}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <Flex justify="between" align="center" wrap="wrap">
        <label className="text-2xl font-bold">
          {t("notification.offline.full_title", "离线通知设置")}
        </label>
        <TextField.Root
          type="text"
          className="max-w-64"
          placeholder={t("common.search", "搜索服务器")}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </Flex>

      <OfflineNotificationTable
        search={search}
        selected={selected}
        onSelectionChange={setSelected}
      />

      <Flex gap="2" align="center">
        <Dialog.Root open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
          <Dialog.Trigger>
            <Button
              variant="soft"
              onClick={() => {
                const first = offlineNotification.find(
                  (n) => n.client === selected[0]
                );
                setBatchForm({
                  enable: first?.enable ?? true,
                  cooldown: first?.cooldown ?? 1800,
                  grace_period: first?.grace_period ?? 300,
                });
              }}
              disabled={batchLoading || selected.length === 0}
            >
              {t("notification.offline.batch_edit", "批量编辑选中的节点")}
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>{t("notification.offline.batch_edit", "批量编辑设置")}</Dialog.Title>
            <NotificationEditForm
              initialValues={batchForm}
              loading={batchLoading}
              onSubmit={handleBatchEdit}
              onCancel={() => setBatchDialogOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </div>
  );
};

const OfflineNotificationTable = ({
  search,
  selected,
  onSelectionChange,
}: {
  search: string;
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}) => {
  const { offlineNotification } = useOfflineNotification();
  const { nodeDetail } = useNodeDetails();
  const { t } = useTranslation();
  const filtered = [...nodeDetail]
    .sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
    .filter((node) => node.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-6">
              <Checkbox
                checked={
                  selected.length === filtered.length && filtered.length > 0
                    ? true
                    : selected.length > 0
                    ? "indeterminate"
                    : false
                }
                onCheckedChange={(checked) =>
                  onSelectionChange(checked ? filtered.map((n) => n.uuid) : [])
                }
              />
            </TableHead>
            <TableHead>{t("common.server", "服务器")}</TableHead>
            <TableHead>{t("common.status", "告警状态")}</TableHead>
            <TableHead>{t("notification.offline.grace_period", "容忍周期")}</TableHead>
            <TableHead>{t("notification.offline.last_notified", "上次通知时间")}</TableHead>
            <TableHead>{t("common.action", "操作")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((node) => {
            const notif = offlineNotification.find((n) => n.client === node.uuid);
            return (
              <TableRow key={node.uuid}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(node.uuid)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectionChange([...selected, node.uuid]);
                      } else {
                        onSelectionChange(
                          selected.filter((id) => id !== node.uuid)
                        );
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{node.name}</TableCell>
                <TableCell>
                  <Badge color={notif?.enable ? "green" : "red"}>
                    {notif?.enable ? t("common.enabled", "已启用") : t("common.disabled", "已禁用")}
                  </Badge>
                </TableCell>
                <TableCell>{notif?.grace_period || 300}s</TableCell>
                <TableCell>
                  {(() => {
                    const lastNotified = notif?.last_notified;
                    if (!lastNotified) return "-";
                    const date = new Date(lastNotified);
                    if (date.getFullYear() < 2000)
                      return t("notification.offline.never_triggered", "从未触发");
                    return date.toLocaleString();
                  })()}
                </TableCell>
                <TableCell>
                  <ActionButtons offlineNotifications={notif} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const ActionButtons = ({
  offlineNotifications,
}: {
  offlineNotifications: OfflineNotification | undefined;
}) => {
  const { t } = useTranslation();
  const { refresh } = useOfflineNotification();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);

  return (
    <Flex gap="2" align="center">
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Trigger>
          <IconButton variant="ghost">
            <Pencil size={16} />
          </IconButton>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>{t("common.edit", "编辑离线告警设置")}</Dialog.Title>
          <NotificationEditForm
            initialValues={{
              enable: offlineNotifications?.enable ?? false,
              cooldown: offlineNotifications?.cooldown ?? 1800,
              grace_period: offlineNotifications?.grace_period ?? 300,
            }}
            loading={editSaving}
            onSubmit={(values) => {
              setEditSaving(true);
              fetch("/api/admin/notification/offline/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([
                  {
                    client: offlineNotifications?.client,
                    ...values,
                  },
                ]),
              })
                .then((res) => {
                  if (!res.ok) {
                    toast.error("Failed to save: " + res.statusText);
                  } else {
                    toast.success(t("common.updated_successfully", "保存成功"));
                  }
                  return res.json();
                })
                .then(() => {
                  setEditOpen(false);
                  refresh();
                })
                .catch((error) => {
                  toast.error(error.message);
                })
                .finally(() => setEditSaving(false));
            }}
            onCancel={() => setEditOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
};
