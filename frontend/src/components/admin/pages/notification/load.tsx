"use client";

import Loading from "@/components/loading";
import NodeSelectorDialog from "@/components/NodeSelectorDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LoadAlertProvider,
  useLoadAlert,
  type LoadAlert,
} from "@/contexts/LoadAlertContext";
import {
  NodeDetailsProvider,
  useNodeDetails,
} from "@/contexts/NodeDetailsContext";

import {
  Button,
  Dialog,
  Flex,
  IconButton,
  Select,
  TextField,
} from "@radix-ui/themes";
import { Pencil, Trash } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function LoadNotificationPage() {
  return (
    <LoadAlertProvider>
      <NodeDetailsProvider>
        <InnerLayout />
      </NodeDetailsProvider>
    </LoadAlertProvider>
  );
}

const InnerLayout = () => {
  const { loadAlerts, isLoading, error } = useLoadAlert();
  const { isLoading: nodeDetailLoading, error: nodeDetailError } =
    useNodeDetails();
  const { t } = useTranslation();

  if (isLoading || nodeDetailLoading) {
    return <Loading />;
  }
  if (error || nodeDetailError) {
    return <div className="p-4 text-red-500">{error || nodeDetailError}</div>;
  }

  return (
    <Flex direction="column" gap="4" className="p-4">
      <div className="flex justify-between items-center">
        <label className="text-2xl font-bold">
          {t("notification.load.title", "负载告警规则")}
        </label>
        <AddAlertRuleDialog />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name", "规则名称")}</TableHead>
              <TableHead>{t("notification.load.metric", "指标")}</TableHead>
              <TableHead>{t("notification.load.threshold", "阈值")}</TableHead>
              <TableHead>{t("notification.load.duration", "持续时间")}</TableHead>
              <TableHead>{t("common.server", "适用节点")}</TableHead>
              <TableHead>{t("common.action", "操作")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(loadAlerts || []).map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>{rule.metric}</TableCell>
                <TableCell>{rule.threshold}</TableCell>
                <TableCell>{rule.duration}s</TableCell>
                <TableCell>
                  {rule.clients && rule.clients.length > 0
                    ? `${rule.clients.length} 个节点`
                    : t("common.all", "全部节点")}
                </TableCell>
                <TableCell>
                  <RuleActionButtons rule={rule} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Flex>
  );
};

const AddAlertRuleDialog = () => {
  const { t } = useTranslation();
  const { refresh } = useLoadAlert();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [selectedClients, setSelectedClients] = React.useState<string[]>([]);
  const [metric, setMetric] = React.useState("cpu");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const threshold = Number((form.elements.namedItem("threshold") as HTMLInputElement).value);
    const duration = Number((form.elements.namedItem("duration") as HTMLInputElement).value);

    setSaving(true);
    fetch("/api/admin/notification/load/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        metric,
        threshold,
        duration,
        clients: selectedClients,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add rule");
        return res.json();
      })
      .then(() => {
        toast.success(t("common.added_successfully", "添加成功"));
        setOpen(false);
        refresh();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setSaving(false));
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>{t("common.add", "添加规则")}</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{t("notification.load.add_rule", "新建负载告警规则")}</Dialog.Title>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 my-2">
          <div>
            <label className="text-sm font-medium mb-1 block">{t("common.name", "名称")}</label>
            <TextField.Root name="name" required placeholder="如：CPU 高负载告警" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t("notification.load.metric", "指标")}</label>
            <Select.Root value={metric} onValueChange={setMetric}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="cpu">CPU 占用率 (%)</Select.Item>
                <Select.Item value="memory">内存 占用率 (%)</Select.Item>
                <Select.Item value="disk">磁盘 占用率 (%)</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t("notification.load.threshold", "触发阈值 (%)")}</label>
            <TextField.Root type="number" name="threshold" defaultValue={85} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t("notification.load.duration", "持续时间 (秒)")}</label>
            <TextField.Root type="number" name="duration" defaultValue={300} required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t("common.server", "适用节点 (不选代表全部)")}</label>
            <NodeSelectorDialog value={selectedClients} onChange={setSelectedClients} />
          </div>
          <Flex gap="2" justify="end" mt="4">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">{t("common.cancel", "取消")}</Button>
            </Dialog.Close>
            <Button disabled={saving} type="submit">{t("common.save", "保存")}</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

const RuleActionButtons = ({ rule }: { rule: LoadAlert }) => {
  const { t } = useTranslation();
  const { refresh } = useLoadAlert();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleDelete = () => {
    fetch("/api/admin/notification/load/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete rule");
        toast.success(t("common.deleted_successfully", "已删除"));
        setDeleteOpen(false);
        refresh();
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
      <Dialog.Trigger>
        <IconButton variant="soft" color="red">
          <Trash size="16" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{t("common.confirm_delete", "确认删除该告警规则？")}</Dialog.Title>
        <Flex gap="2" justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft" color="gray">{t("common.cancel", "取消")}</Button>
          </Dialog.Close>
          <Button color="red" onClick={handleDelete}>{t("common.delete", "删除")}</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
