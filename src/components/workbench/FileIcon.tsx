import type { ReactNode } from "react";
import {
  ApiOutlined,
  DashboardOutlined,
  DesktopOutlined,
  FileOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { PageInfo, PageKind } from "../../lib/routes";

type Glyph = [ReactNode, string];

// Seti-like colours so each "file type" is recognisable at a glance.
const byKind: Record<PageKind, Glyph> = {
  overview: [<DashboardOutlined />, "#519aba"],
  miner: [<DesktopOutlined />, "#e37933"],
  payments: [<WalletOutlined />, "#cbcb41"],
  connect: [<ApiOutlined />, "#a074c4"],
  admin: [<SafetyCertificateOutlined />, "#e05252"],
  missing: [<FileOutlined />, "#8c8c8c"],
};
const byPath: Record<string, Glyph> = {
  "/admin/miners": [<TeamOutlined />, "#e37933"],
  "/admin/payments": [<WalletOutlined />, "#cbcb41"],
  "/admin/config": [<SettingOutlined />, "#cbcb41"],
};

export function FileIcon({ page }: { page: Pick<PageInfo, "path" | "kind"> }) {
  const [icon, color] = byPath[page.path] ?? byKind[page.kind];
  return (
    <span className="file-icon" style={{ color }} aria-hidden="true">
      {icon}
    </span>
  );
}
