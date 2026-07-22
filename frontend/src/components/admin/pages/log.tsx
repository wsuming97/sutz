"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import NumberPicker from "@/components/ui/number-picker";
import Loading from "@/components/loading";

interface Log {
  id: number;
  ip: string;
  uuid: string;
  message: string;
  msg_type: string;
  time: string;
}

export default function LogPage() {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [logs, setLogs] = React.useState<Log[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);
  const [total, setTotal] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(10);
  const [t] = useTranslation();

  React.useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/logs?limit=${limit}&page=${page}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch logs");
        }
        const data = await response.json();
        setLogs(data.data.logs || []);
        setTotal(data.data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageNumbers = React.useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const result: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    let prev: number | null = null;
    for (const i of range) {
      if (prev !== null) {
        if (i - prev === 2) {
          result.push(prev + 1);
        } else if (i - prev > 2) {
          result.push("...");
        }
      }
      result.push(i);
      prev = i;
    }
    return result;
  }, [page, totalPages]);

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <div className="p-4 text-red-500">{t("common.error", "错误")}: {error}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("logs.title", "系统日志")}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {t("logs.per_page", "每页条数")}
          <NumberPicker defaultValue={limit} onChange={setLimit} min={1} max={100} />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>{t("logs.type", "类型")}</TableHead>
              <TableHead>{t("logs.message", "消息内容")}</TableHead>
              <TableHead>{t("logs.time", "时间")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Dialog.Root>
                    <Dialog.Trigger>
                      <label className="hover:underline font-bold cursor-pointer text-primary">
                        {log.id}
                      </label>
                    </Dialog.Trigger>
                    <Dialog.Content>
                      <Dialog.Title>{t("logs.details", "日志详情")}</Dialog.Title>
                      <Flex direction="column" gap="1" className="my-2">
                        <label className="font-bold">ID</label>
                        <label className="text-sm">{log.id}</label>
                        <label className="font-bold">IP</label>
                        <label className="text-sm">{log.ip}</label>
                        <label className="font-bold">UUID</label>
                        <label className="text-sm">{log.uuid}</label>
                        <label className="font-bold">{t("logs.type", "类型")}</label>
                        <label className="text-sm">{log.msg_type}</label>
                        <label className="font-bold">{t("logs.message", "消息内容")}</label>
                        <label className="text-sm break-words">{log.message}</label>
                        <label className="font-bold">{t("logs.time", "时间")}</label>
                        <label className="text-sm">
                          {new Date(log.time).toLocaleString()}
                        </label>
                      </Flex>
                      <Flex justify={"end"}>
                        <Dialog.Close>
                          <Button variant="soft">{t("common.close", "关闭")}</Button>
                        </Dialog.Close>
                      </Flex>
                    </Dialog.Content>
                  </Dialog.Root>
                </TableCell>
                <TableCell>{log.ip}</TableCell>
                <TableCell>{log.msg_type}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {log.message.length > 75
                    ? `${log.message.slice(0, 75)}...`
                    : log.message}
                </TableCell>
                <TableCell>{new Date(log.time).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center space-x-2 mt-4 gap-2">
        <Button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          variant="soft"
        >
          {"<"}
        </Button>
        {pageNumbers.map((p, i) =>
          typeof p === "number" ? (
            <Button
              key={i}
              variant={p === page ? "solid" : "soft"}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ) : (
            <span key={i} className="px-2 text-muted-foreground">...</span>
          )
        )}
        <Button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          variant="soft"
        >
          {">"}
        </Button>
      </div>
    </div>
  );
}
