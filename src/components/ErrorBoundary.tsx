import { Component, type ReactNode } from "react";
import { Button, Result } from "antd";
import { useT } from "../i18n";

const reloadKey = "nomp:chunk-reload";

/** After a deploy, old lazily-loaded chunks 404; reload once to pick up the new build. */
export function isChunkError(error: unknown) {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch dynamically/i.test(
      error.message,
    )
  );
}

function Crash() {
  const t = useT();
  return (
    <Result
      status="warning"
      title={t.crash.title}
      subTitle={t.crash.hint}
      extra={
        <Button type="primary" onClick={() => window.location.reload()}>
          {t.crash.reload}
        </Button>
      }
    />
  );
}

export class ErrorBoundary extends Component<
  { children: ReactNode; resetKey?: string },
  { failed: boolean; resetKey?: string }
> {
  state = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(
    props: { resetKey?: string },
    state: { failed: boolean; resetKey?: string },
  ) {
    // Navigating elsewhere clears a page-level failure.
    return props.resetKey !== state.resetKey
      ? { failed: false, resetKey: props.resetKey }
      : null;
  }

  componentDidCatch(error: unknown) {
    console.error(error);
    if (!isChunkError(error)) return;
    try {
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, "1");
    } catch {
      return;
    }
    window.location.reload();
  }

  componentDidMount() {
    // A successful render means the current build loads; allow future recovery.
    window.setTimeout(() => {
      try {
        sessionStorage.removeItem(reloadKey);
      } catch {
        /* storage may be disabled */
      }
    }, 10000);
  }

  render() {
    return this.state.failed ? <Crash /> : this.props.children;
  }
}
