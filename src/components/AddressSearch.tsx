import { useState } from "react";
import { App, Button, Checkbox, Form, Input, Tag } from "antd";
import { ArrowRightOutlined, SearchOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { minerPath, shorten, validAddress } from "../lib/format";
import { site } from "../lib/config";
import { useT } from "../i18n";
import {
  clearRecentAddresses,
  rememberAddress,
  useRecentAddresses,
} from "../lib/recent";

export function AddressSearch({
  initial = "",
  hero = false,
}: {
  initial?: string;
  hero?: boolean;
}) {
  const navigate = useNavigate();
  const t = useT();
  const [remember, setRemember] = useState(false);
  const recent = useRecentAddresses();
  const { message } = App.useApp();
  const onFinish = ({ address }: { address: string }) => {
    const value = address.trim();
    if (remember && !rememberAddress(value))
      void message.warning(t.search.storageBlocked);
    navigate(minerPath(value));
  };
  return (
    <div className={hero ? "address-search hero-search" : "address-search"}>
      <Form
        key={initial}
        onFinish={onFinish}
        initialValues={{ address: initial }}
      >
        <div className="search-row">
          <Form.Item
            name="address"
            rules={[
              {
                validator: (_, value: string) =>
                  validAddress((value || "").trim())
                    ? Promise.resolve()
                    : Promise.reject(new Error(t.search.invalid)),
              },
            ]}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder={t.search.placeholder}
              aria-label={t.shell.searchLabel}
              size="large"
              allowClear
              autoComplete="off"
              maxLength={256}
            />
          </Form.Item>
          <Button type="primary" size="large" htmlType="submit">
            {t.search.submit} <ArrowRightOutlined />
          </Button>
        </div>
        <div className="search-hint">
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          >
            {t.search.remember}
          </Checkbox>
          <span>{t.search.noSignup}</span>
        </div>
      </Form>
      {!hero && !!recent.length && (
        <div className="recent-addresses">
          <span>{t.search.recent}</span>
          {recent.slice(0, 4).map((address) => (
            <Tag key={address}>
              <Link to={minerPath(address)} title={address}>
                {shorten(address)}
              </Link>
            </Tag>
          ))}
          <Button type="text" size="small" onClick={clearRecentAddresses}>
            {t.common.clear}
          </Button>
        </div>
      )}
      {site.demo && (
        <Button
          className="demo-address"
          type="link"
          size="small"
          onClick={async () => {
            const { demoAddress } = await import("../lib/demo");
            navigate(minerPath(demoAddress));
          }}
        >
          {t.search.demoAddress}
        </Button>
      )}
    </div>
  );
}
