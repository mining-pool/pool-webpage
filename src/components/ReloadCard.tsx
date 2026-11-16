import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Tag } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { reload, type AdminSession, type ReloadReport } from "../lib/auth";
import { site } from "../lib/config";
import { formatTime } from "../lib/format";
import { errorText, useT } from "../i18n";
import { QueryState } from "./Common";

export function Report({ report }: { report: ReloadReport }) {
  const t = useT();
  return (
    <div className="reload-report" data-testid="reload-report">
      <div className="reload-summary">
        <Tag color={report.ok ? "green" : "red"}>
          {report.ok ? t.admin.reloadOk : t.admin.reloadFailed}
        </Tag>
        <span>
          {t.admin.reloadLast(
            formatTime(Date.parse(report.at)),
            t.admin.reloadTriggers[report.trigger] ?? report.trigger,
          )}
          {report.actor ? ` · ${report.actor}` : ""}
        </span>
      </div>
      {!!report.changes.length && (
        <div>
          <h4>{t.admin.reloadChanges}</h4>
          <ul className="mono">
            {report.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </div>
      )}
      {!!report.errors.length && (
        <div className="reload-errors">
          <h4>{t.admin.reloadErrors}</h4>
          <ul className="mono">
            {report.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Shows the last configuration reload and lets an administrator trigger one. */
export function ReloadCard() {
  const t = useT();
  const client = useQueryClient();
  const session = client.getQueryData<AdminSession | null>(["admin-session"]);
  const status = useQuery({
    queryKey: ["admin-reload", true],
    queryFn: ({ signal }) => reload.status(signal),
    enabled: !site.demo,
    refetchInterval: 30000,
  });
  const run = useMutation({
    mutationFn: () => reload.run(session!.csrfToken),
    onSuccess: (report) => {
      client.setQueryData(["admin-reload", true], { last: report });
      // Ports and other public settings may have changed.
      void client.invalidateQueries({ queryKey: ["metadata"] });
    },
  });
  const last = run.data ?? status.data?.last;
  return (
    <Card
      title={t.admin.reloadTitle}
      extra={
        <Button
          icon={<SyncOutlined spin={run.isPending} />}
          disabled={site.demo || !session}
          loading={run.isPending}
          onClick={() => run.mutate()}
        >
          {t.admin.reloadButton}
        </Button>
      }
    >
      <p className="card-subtitle">{t.admin.reloadHint}</p>
      {site.demo ? (
        <p className="muted">{t.admin.reloadDemo}</p>
      ) : (
        <>
          <QueryState query={status} />
          {run.error && (
            <Alert
              className="query-alert"
              type="error"
              showIcon
              title={errorText(t, run.error)}
            />
          )}
          {last ? (
            <Report report={last} />
          ) : (
            status.data && <p className="muted">{t.admin.reloadNever}</p>
          )}
        </>
      )}
    </Card>
  );
}
