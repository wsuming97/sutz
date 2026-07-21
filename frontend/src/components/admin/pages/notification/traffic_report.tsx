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
  TrafficReportNotificationProvider,
  useTrafficReportNotification,
  type TrafficReportNotification,
} from "@/contexts/TrafficReportContext";
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

export default function TrafficReportNotificationPage() {
  return (
    <TrafficReportNotificationProvider>
      <NodeDetailsProvider>
        <InnerLayout />
      </NodeDetailsProvider>
    </TrafficReportNotificationProvider>
  );
}

const InnerLayout = () => {
  const { trafficReportNotification, loading, error, refresh } = useTrafficReportNotification();
  const { nodeDetail, isLoading: nodeLoading } = useNodeDetails();
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");

  if (loading || nodeLoading) {
    return <Loading />;
  }
  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  const filtered = nodeDetail.filter((node) =>
    node.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <Flex justify="between" align="center" wrap="wrap">
        <h1 className="text-2xl font-bold">
          {t("notification.traffic_report.title", "流量日报/周报/月报告警")}
        </h1>
        <TextField.Root
          type="text"
          className="max-w-64"
          placeholder={t("common.search", "搜索服务器")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </Flex>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.server", "服务器")}</TableHead>
              <TableHead>{t("common.status", "状态")}</TableHead>
              <TableHead>日报</TableHead>
              <TableHead>周报</TableHead>
              <TableHead>月报</TableHead>
              <TableHead>{t("common.action", "操作")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((node) => {
              const item = trafficReportNotification.find((n) => n.client === node.uuid);
              return (
                <TableRow key={node.uuid}>
                  <TableCell className="font-medium">{node.name}</TableCell>
                  <TableCell>
                    <Badge color={item?.enable ? "green" : "gray"}>
                      {item?.enable ? t("common.enabled", "已启用") : t("common.disabled", "已禁用")}
                    </Badge>
                  </TableCell>
                  <TableCell>{item?.daily ? "✓" : "-"}</TableCell>
                  <TableCell>{item?.weekly ? "✓" : "-"}</TableCell>
                  <TableCell>{item?.monthly ? "✓" : "-"}</TableCell>
                  <TableCell>
                    <EditDialog item={item} nodeUuid={node.uuid} refresh={refresh} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const EditDialog = ({
  item,
  nodeUuid,
  refresh,
}: {
  item?: TrafficReportNotification;
  nodeUuid: string;
  refresh: () => void;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [enable, setEnable] = React.useState(item?.enable ?? false);
  const [daily, setDaily] = React.useState(item?.daily ?? true);
  const [weekly, setWeekly] = React.useState(item?.weekly ?? true);
  const [monthly, setMonthly] = React.useState(item?.monthly ?? true);

  const handleSave = () => {
    setSaving(true);
    fetch("/api/admin/notification/traffic-report/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          client: nodeUuid,
          enable,
          daily,
          weekly,
          monthly,
        },
      ]),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Save failed");
        toast.success(t("common.saved_successfully", "已保存"));
        setOpen(false);
        refresh();
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setSaving(false));
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton variant="ghost">
          <Pencil size="16" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{t("common.edit", "编辑流量推送")}</Dialog.Title>
        <div className="flex flex-col gap-3 py-2">
          <Flex align="center" gap="2">
            <Switch checked={enable} onCheckedChange={setEnable} />
            <label>{t("common.enable", "开启流量报表推送")}</label>
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox checked={daily} onCheckedChange={(v) => setDaily(!!v)} />
            <label>每日推送到期与消耗统计</label>
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox checked={weekly} onCheckedChange={(v) => setWeekly(!!v)} />
            <label>每周流量总结</label>
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox checked={monthly} onCheckedChange={(v) => setMonthly(!!v)} />
            <label>每月月结报表</label>
          </Flex>
        </div>
        <Flex gap="2" justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft" color="gray">{t("common.cancel", "取消")}</Button>
          </Dialog.Close>
          <Button disabled={saving} onClick={handleSave}>{t("common.save", "保存")}</Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
