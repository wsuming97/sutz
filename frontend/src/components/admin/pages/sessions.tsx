"use client";

import React from "react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { Dialog, Flex, Button } from "@radix-ui/themes";
import { UserAgentHelper } from "@/utils/UserAgentHelper";
import Loading from "@/components/loading";

type Resp = {
  current: string;
  data: Array<{
    uuid: string;
    session: string;
    user_agent: string;
    ip: string;
    login_method: string;
    latest_online: string;
    latest_ip: string;
    latest_user_agent: string;
    expires: string;
    created_at: string;
  }>;
  status: string;
};

export default function SessionsPage() {
  const [t] = useTranslation();
  const [sessions, setSessions] = React.useState<Resp | null>(null);

  const fetchSessions = () => {
    fetch("/api/admin/session/get")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: Resp) => {
        setSessions(data);
      })
      .catch((error) => {
        console.error("Error fetching sessions:", error);
        toast.error(error.message);
      });
  };

  React.useEffect(() => {
    fetchSessions();
  }, []);

  function deleteSession(sessionId: string) {
    const isCurrent = sessionId === sessions?.current;
    fetch("/api/admin/session/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: sessionId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          toast.success(t("sessions.deleted_successfully", "会话清除成功"));
          if (isCurrent) {
            window.location.reload();
          } else {
            fetchSessions();
          }
        } else {
          toast.error(data.message || t("sessions.failed_to_delete", "清除失败"));
        }
      })
      .catch((error) => {
        console.error("Error deleting session:", error);
        toast.error(error.message);
      });
  }

  function deleteAllSessions() {
    fetch("/api/admin/session/remove/all", {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          toast.success(t("sessions.all_deleted_successfully", "所有会话已清除"));
          window.location.reload();
        } else {
          toast.error(data.message || t("sessions.failed_to_delete_all", "清除失败"));
        }
      })
      .catch((error) => {
        console.error("Error deleting all sessions:", error);
        toast.error(error.message);
      });
  }

  if (!sessions) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("sessions.title", "会话管理")}</h1>
        <Dialog.Root>
          <Dialog.Trigger>
            <Button color="red" variant="solid">
              {t("sessions.delete_all", "注销所有会话")}
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>{t("sessions.confirm_delete_all", "确认注销所有会话？")}</Dialog.Title>
            <Flex gap="2" justify="end" className="mt-4">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  {t("common.cancel", "取消")}
                </Button>
              </Dialog.Close>
              <Button color="red" onClick={deleteAllSessions}>
                {t("common.confirm", "确认")}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sessions.ip", "IP 地址")}</TableHead>
              <TableHead>{t("sessions.user_agent", "设备/浏览器")}</TableHead>
              <TableHead>{t("sessions.login_method", "登录方式")}</TableHead>
              <TableHead>{t("sessions.latest_online", "最后在线")}</TableHead>
              <TableHead>{t("common.action", "操作")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.data.map((s) => {
              const isCurrent = s.session === sessions.current;
              return (
                <TableRow key={s.session}>
                  <TableCell>
                    {s.latest_ip || s.ip}
                    {isCurrent && (
                      <span className="ml-2 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-medium">
                        {t("sessions.current", "当前会话")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {UserAgentHelper.format(s.latest_user_agent || s.user_agent, t)}
                  </TableCell>
                  <TableCell>{s.login_method}</TableCell>
                  <TableCell>{new Date(s.latest_online).toLocaleString()}</TableCell>
                  <TableCell>
                    <Dialog.Root>
                      <Dialog.Trigger>
                        <Button color="red" variant="soft" size="1">
                          {t("sessions.revoke", "注销")}
                        </Button>
                      </Dialog.Trigger>
                      <Dialog.Content>
                        <Dialog.Title>{t("sessions.confirm_revoke", "确认注销该会话？")}</Dialog.Title>
                        <Flex gap="2" justify="end" className="mt-4">
                          <Dialog.Close>
                            <Button variant="soft" color="gray">
                              {t("common.cancel", "取消")}
                            </Button>
                          </Dialog.Close>
                          <Button color="red" onClick={() => deleteSession(s.session)}>
                            {t("common.confirm", "确认")}
                          </Button>
                        </Flex>
                      </Dialog.Content>
                    </Dialog.Root>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
