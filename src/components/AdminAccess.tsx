import { useCallback, useEffect, type ReactNode } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type Query,
} from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Tag } from "antd";
import {
  LockOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { PageTitle, QueryState } from "./Common";
import { auth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { errorText, useT } from "../i18n";

const sessionKey = ["admin-session"];
const adminData = (query: Query) =>
  query.queryKey[1] === true || query.queryKey[0] === "admin-miner";

export function AdminAccess({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const t = useT();
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => auth.session(signal),
    retry: false,
    staleTime: 0,
    refetchInterval: 60000,
  });
  const forget = useCallback(async () => {
    await client.cancelQueries({ queryKey: sessionKey });
    client.setQueryData(sessionKey, null);
    // Unmount protected views immediately, then cancel and discard cached data.
    await client.cancelQueries({ predicate: adminData });
    client.removeQueries({ predicate: adminData });
  }, [client]);
  useEffect(() => {
    const expired = () => {
      void client.cancelQueries({ queryKey: sessionKey }).then(forget);
    };
    window.addEventListener("nomp:session-expired", expired);
    return () => window.removeEventListener("nomp:session-expired", expired);
  }, [client, forget]);
  useEffect(() => {
    if (session.data !== null) return;
    void client
      .cancelQueries({ predicate: adminData })
      .then(() => client.removeQueries({ predicate: adminData }));
  }, [client, session.data]);
  const login = useMutation({
    mutationFn: auth.login,
    onSuccess: async (value) => {
      await client.cancelQueries({ queryKey: sessionKey });
      await client.cancelQueries({ predicate: adminData });
      client.removeQueries({ predicate: adminData });
      client.setQueryData(sessionKey, value);
    },
  });
  const logout = useMutation({
    mutationFn: () => auth.logout(session.data!.csrfToken),
    onSuccess: forget,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) void forget();
    },
  });
  if (session.isPending || session.isError)
    return (
      <>
        <PageTitle
          eyebrow={t.auth.eyebrow}
          title={t.auth.checkingTitle}
          description={t.auth.checking}
        />
        <QueryState query={session} />
      </>
    );
  if (!session.data)
    return (
      <>
        <PageTitle
          eyebrow={t.auth.eyebrow}
          title={t.auth.title}
          description={t.auth.description}
        />
        <Card className="admin-login-card">
          <div className="admin-login-icon">
            <SafetyCertificateOutlined />
          </div>
          <h2>{t.auth.heading}</h2>
          <p className="card-subtitle">{t.auth.hint}</p>
          {login.error && (
            <Alert
              className="query-alert"
              type="error"
              showIcon
              title={errorText(t, login.error)}
            />
          )}
          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={(values: { username: string; password: string }) =>
              login.mutate(values)
            }
          >
            <Form.Item
              name="username"
              label={t.auth.username}
              rules={[{ required: true, message: t.auth.usernameRequired }]}
            >
              <Input
                prefix={<UserOutlined />}
                autoComplete="username"
                maxLength={128}
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t.auth.password}
              rules={[{ required: true, message: t.auth.passwordRequired }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="current-password"
                size="large"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={login.isPending}
            >
              {t.auth.submit}
            </Button>
          </Form>
        </Card>
      </>
    );
  return (
    <>
      <div className="admin-session-bar">
        <span>
          <Tag color="green">{t.auth.signedIn}</Tag>
          {session.data.username}
        </span>
        <Button
          icon={<LogoutOutlined />}
          loading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {t.auth.logout}
        </Button>
      </div>
      {logout.error && (
        <Alert
          className="query-alert"
          type="error"
          showIcon
          title={errorText(t, logout.error)}
        />
      )}
      {children}
    </>
  );
}
