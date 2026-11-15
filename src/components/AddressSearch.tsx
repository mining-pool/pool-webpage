import { useState } from "react";
import { App, Button, Checkbox, Form, Input, Tag } from "antd";
import { ArrowRightOutlined, SearchOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { minerPath, shorten, validAddress } from "../lib/format";
import { site } from "../lib/config";
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
  const [remember, setRemember] = useState(false);
  const recent = useRecentAddresses();
  const { message } = App.useApp();
  const onFinish = ({ address }: { address: string }) => {
    const value = address.trim();
    if (remember && !rememberAddress(value))
      void message.warning("浏览器不允许保存地址，本次查询不受影响。");
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
                    : Promise.reject(
                        new Error(
                          "请输入有效的钱包地址或矿工标识（不含空白、/、?、#）。",
                        ),
                      ),
              },
            ]}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="输入你的钱包地址，查看挖矿状态"
              aria-label="钱包地址"
              size="large"
              allowClear
              autoComplete="off"
              maxLength={256}
            />
          </Form.Item>
          <Button type="primary" size="large" htmlType="submit">
            查询矿工 <ArrowRightOutlined />
          </Button>
        </div>
        <div className="search-hint">
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          >
            在此设备记住地址
          </Checkbox>
          <span>无需注册 · 无需连接钱包</span>
        </div>
      </Form>
      {!hero && !!recent.length && (
        <div className="recent-addresses">
          <span>最近查询</span>
          {recent.slice(0, 4).map((address) => (
            <Tag key={address}>
              <Link to={minerPath(address)} title={address}>
                {shorten(address)}
              </Link>
            </Tag>
          ))}
          <Button type="text" size="small" onClick={clearRecentAddresses}>
            清除
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
          使用演示矿工地址 →
        </Button>
      )}
    </div>
  );
}
