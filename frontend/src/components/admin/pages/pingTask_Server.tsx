"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNodeDetails } from "@/contexts/NodeDetailsContext";
import { usePingTask, type PingTask } from "@/contexts/PingTaskContext";
import { Button, Dialog, Flex, IconButton } from "@radix-ui/themes";
import { MoreHorizontal } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Selector } from "@/components/Selector";

export const ServerView = ({ pingTasks }: { pingTasks: PingTask[] }) => {
  const { t } = useTranslation();
  const { nodeDetail } = useNodeDetails();

  const sortedNodes = React.useMemo(
    () =>
      [...nodeDetail].sort((a, b) => {
        const wa = a.weight ?? 0;
        const wb = b.weight ?? 0;
        if (wa !== wb) return wa - wb;
        return a.name.localeCompare(b.name);
      }),
    [nodeDetail]
  );

  return (
    <div className="rounded-xl overflow-hidden border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">{t("common.server", "服务器")}</TableHead>
            <TableHead>{t("ping.task", "关联 Ping 任务")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedNodes.map((n) => (
            <ServerRow
              key={n.uuid}
              nodeUuid={n.uuid}
              nodeName={n.name}
              pingTasks={pingTasks}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const ServerRow: React.FC<{
  nodeUuid: string;
  nodeName: string;
  pingTasks: PingTask[];
}> = ({ nodeUuid, nodeName, pingTasks }) => {
  const { t } = useTranslation();
  const { refresh } = usePingTask();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const boundTaskIds = React.useMemo(
    () =>
      pingTasks
        .filter(
          (task) =>
            task.id !== undefined &&
            (task.default_on || (task.clients && task.clients.includes(nodeUuid)))
        )
        .map((task) => task.id as number),
    [pingTasks, nodeUuid]
  );

  const [selectedTaskIds, setSelectedTaskIds] = React.useState<number[]>(boundTaskIds);

  React.useEffect(() => {
    setSelectedTaskIds(boundTaskIds);
  }, [boundTaskIds]);


  const handleSave = () => {
    setSaving(true);
    const updatedTasks = pingTasks
      .filter((task) => task.id !== undefined)
      .map((task) => {
        const taskId = task.id as number;
        const currentClients = task.clients || [];
        const isSelected = selectedTaskIds.includes(taskId);
        const isCurrentlyBound = currentClients.includes(nodeUuid);

        let newClients = currentClients;
        if (isSelected && !isCurrentlyBound) {
          newClients = [...currentClients, nodeUuid];
        } else if (!isSelected && isCurrentlyBound) {
          newClients = currentClients.filter((uuid) => uuid !== nodeUuid);
        }

        return {
          id: taskId,
          name: task.name,
          type: task.type,
          target: task.target,
          default_on: task.default_on,
          clients: newClients,
          interval: task.interval,
        };
      });

    fetch("/api/admin/ping/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: updatedTasks }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data?.message || t("common.error"));
          });
        }
        return res.json();
      })
      .then(() => {
        setOpen(false);
        toast.success(t("common.updated_successfully", "更新绑定成功"));
        refresh();
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => setSaving(false));
  };

  const boundTaskNames = React.useMemo(() => {
    const names = pingTasks
      .filter(
        (task) =>
          task.id !== undefined &&
          (task.default_on || (task.clients && task.clients.includes(nodeUuid)))
      )
      .map((task) => task.name);
    return names.join(", ");
  }, [pingTasks, nodeUuid]);

  return (
    <TableRow>
      <TableCell className="font-medium">{nodeName}</TableCell>
      <TableCell>
        <Flex gap="2" align="center">
          <span className="text-sm">
            {boundTaskNames || t("common.none", "无")}
          </span>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>
              <IconButton variant="ghost">
                <MoreHorizontal size="16" />
              </IconButton>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>
                {t("ping.bind_tasks", "编辑关联的任务")} - {nodeName}
              </Dialog.Title>
              <div className="flex flex-col gap-4 py-2">
                <Selector
                  items={pingTasks.filter((t) => t.id !== undefined)}
                  getId={(t) => String(t.id)}
                  getLabel={(t) => `${t.name} (${t.target})`}
                  value={selectedTaskIds.map(String)}
                  onChange={(val) => setSelectedTaskIds(val.map(Number))}
                  searchPlaceholder={t("ping.select_tasks", "选择任务")}
                />
              </div>
              <Flex gap="2" justify="end" className="mt-4">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    {t("common.cancel", "取消")}
                  </Button>
                </Dialog.Close>
                <Button variant="solid" onClick={handleSave} disabled={saving}>
                  {t("common.save", "保存")}
                </Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>
      </TableCell>
    </TableRow>
  );
};
