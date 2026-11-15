import { useMemo, useState, type ReactNode } from "react";
import { Modal } from "antd";
import { HistoryOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { explorerPages, pageInfo } from "../../lib/routes";
import { minerPath, validAddress } from "../../lib/format";
import { useRecentAddresses } from "../../lib/recent";
import { FileIcon } from "./FileIcon";

export type Command = {
  id: string;
  label: string;
  detail?: string;
  keybinding?: string;
  icon?: ReactNode;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const navigate = useNavigate();
  const recent = useRecentAddresses();
  const [text, setText] = useState("");
  const [active, setActive] = useState(0);
  const query = text.trim();

  const items = useMemo(() => {
    const pages: Command[] = [
      ...explorerPages.pool,
      ...explorerPages.admin,
    ].map((path) => {
      const page = pageInfo(path);
      return {
        id: path,
        label: `转到: ${page.title}`,
        detail: page.file,
        icon: <FileIcon page={page} />,
        run: () => navigate(path),
      };
    });
    const history: Command[] = recent.map((address) => ({
      id: `recent:${address}`,
      label: address,
      detail: "最近查询",
      icon: <HistoryOutlined />,
      run: () => navigate(minerPath(address)),
    }));
    const needle = query.replace(/^>\s*/, "").toLowerCase();
    const matches = [...pages, ...commands, ...history].filter(
      (item) =>
        !needle ||
        item.label.toLowerCase().includes(needle) ||
        item.detail?.toLowerCase().includes(needle),
    );
    if (validAddress(query) && !query.startsWith(">"))
      matches.unshift({
        id: "lookup",
        label: `查询矿工: ${query}`,
        detail: "按钱包地址打开矿工工作台",
        icon: <SearchOutlined />,
        run: () => navigate(minerPath(query)),
      });
    return matches;
  }, [commands, navigate, query, recent]);

  const current = Math.min(active, Math.max(items.length - 1, 0));
  const execute = (item?: Command) => {
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterOpenChange={(visible) => {
        if (!visible) {
          setText("");
          setActive(0);
        }
      }}
      footer={null}
      closable={false}
      width={600}
      className="command-palette"
      style={{ top: 8 }}
      destroyOnHidden
      title={null}
    >
      <input
        className="palette-input"
        autoFocus
        value={text}
        placeholder="输入钱包地址查询矿工，或输入命令名称…"
        aria-label="命令面板"
        aria-controls="palette-list"
        aria-activedescendant={items[current]?.id}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((current + 1) % Math.max(items.length, 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((current - 1 + items.length) % Math.max(items.length, 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            execute(items[current]);
          }
        }}
      />
      <ul className="palette-list" id="palette-list" role="listbox">
        {items.map((item, index) => (
          <li
            key={item.id}
            id={item.id}
            role="option"
            aria-selected={index === current}
            className={index === current ? "active" : ""}
            onMouseMove={() => setActive(index)}
            onClick={() => execute(item)}
          >
            <span className="palette-icon">{item.icon}</span>
            <span className="palette-label">{item.label}</span>
            {item.detail && (
              <span className="palette-detail">{item.detail}</span>
            )}
            {item.keybinding && <kbd>{item.keybinding}</kbd>}
          </li>
        ))}
        {!items.length && <li className="palette-empty">没有匹配的命令</li>}
      </ul>
    </Modal>
  );
}
