import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Tag } from "antd";
import { SaveOutlined, UndoOutlined } from "@ant-design/icons";
import {
  settingsApi,
  type AdminSession,
  type SettingsDocument,
} from "../lib/auth";
import { ApiError } from "../lib/api";
import { site } from "../lib/config";
import { errorText, useT } from "../i18n";
import { QueryState } from "./Common";
import { Report } from "./ReloadCard";

const pretty = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

function parse(text: string): { value?: unknown; error?: string } {
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value))
      return { error: "settings must be a JSON object" };
    return { value };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Edits the reloadable part of config.json through the admin API. The server
 * validates the whole configuration, writes the file and applies it as one
 * change, refusing if the file changed since it was loaded.
 */
export function SettingsEditor() {
  const t = useT();
  const client = useQueryClient();
  const session = client.getQueryData<AdminSession | null>(["admin-session"]);
  const doc = useQuery({
    queryKey: ["admin-settings", true],
    queryFn: ({ signal }) => settingsApi.get(signal),
    enabled: !site.demo,
    refetchOnWindowFocus: false,
  });
  // The version and text the edit started from. Only a first load, a save or
  // "load latest" moves it; background refreshes never touch edits.
  const [base, setBase] = useState<{ version: string; text: string }>();
  const [text, setText] = useState("");
  const gutter = useRef<HTMLPreElement>(null);

  const adopt = (data: SettingsDocument) => {
    const fresh = pretty(data.settings);
    setBase({ version: data.version, text: fresh });
    setText(fresh);
  };
  useEffect(() => {
    if (doc.data && !base) adopt(doc.data);
  }, [doc.data, base]);

  const dirty = !!base && text !== base.text;
  const parsed = parse(text);
  // Someone changed config.json since this edit started.
  const stale = !!base && !!doc.data && doc.data.version !== base.version;

  const save = useMutation({
    mutationFn: () =>
      settingsApi.put(base!.version, parsed.value, session!.csrfToken),
    onSuccess: async (report) => {
      client.setQueryData(["admin-reload", true], { last: report });
      void client.invalidateQueries({ queryKey: ["metadata"] });
      const latest = await doc.refetch();
      if (latest.data) adopt(latest.data);
    },
  });

  const loadLatest = async () => {
    save.reset();
    const latest = await doc.refetch();
    if (latest.data) adopt(latest.data);
  };

  const conflict =
    stale || (save.error instanceof ApiError && save.error.status === 409);
  const rejected = settingsApi.rejection(save.error);
  const lines = Math.max(1, text.split("\n").length - 1);

  return (
    <Card
      title={t.admin.settingsTitle}
      extra={
        <div className="editor-actions">
          {dirty && <Tag color="gold">{t.admin.settingsModified}</Tag>}
          <Button
            icon={<UndoOutlined />}
            disabled={!dirty || save.isPending}
            onClick={() => {
              save.reset();
              if (base) setText(base.text);
            }}
          >
            {t.admin.settingsRevert}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={save.isPending}
            disabled={site.demo || !session || !dirty || !!parsed.error}
            onClick={() => save.mutate()}
          >
            {t.admin.settingsSave}
          </Button>
        </div>
      }
    >
      <p className="card-subtitle">{t.admin.settingsHint}</p>
      {site.demo ? (
        <p className="muted">{t.admin.reloadDemo}</p>
      ) : (
        <>
          <QueryState query={doc} />
          {doc.data && !doc.data.inForce && (
            <Alert
              className="query-alert"
              type="warning"
              showIcon
              title={t.admin.settingsNotInForce}
            />
          )}
          {conflict && (
            <Alert
              className="query-alert"
              type="warning"
              showIcon
              title={t.admin.settingsConflict}
              action={
                <Button size="small" onClick={() => void loadLatest()}>
                  {t.admin.settingsLoadLatest}
                </Button>
              }
            />
          )}
          {save.error && !conflict && !rejected && (
            <Alert
              className="query-alert"
              type="error"
              showIcon
              title={errorText(t, save.error)}
              description={settingsApi.message(save.error)}
            />
          )}
          {rejected && (
            <Alert
              className="query-alert"
              type="error"
              showIcon
              title={t.admin.settingsRejected}
              description={<Report report={rejected} />}
            />
          )}
          {save.data && <Report report={save.data} />}
          {doc.data && (
            <div className="code-editor">
              <pre className="code-gutter" ref={gutter} aria-hidden="true">
                {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
              </pre>
              <textarea
                aria-label={t.admin.settingsTitle}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                wrap="off"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onScroll={(e) => {
                  if (gutter.current)
                    gutter.current.scrollTop = e.currentTarget.scrollTop;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                  } else if (e.key === "Tab" && !e.shiftKey) {
                    // Indent like an editor instead of leaving the field.
                    e.preventDefault();
                    const el = e.currentTarget;
                    const { selectionStart: start, selectionEnd: end } = el;
                    setText(`${text.slice(0, start)}  ${text.slice(end)}`);
                    requestAnimationFrame(() =>
                      el.setSelectionRange(start + 2, start + 2),
                    );
                  } else if (
                    (e.metaKey || e.ctrlKey) &&
                    e.key.toLowerCase() === "s"
                  ) {
                    e.preventDefault();
                    if (dirty && !parsed.error && session) save.mutate();
                  }
                }}
              />
            </div>
          )}
          {parsed.error && dirty && (
            <p className="field-error" role="alert">
              {t.admin.settingsJsonError(parsed.error)}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
