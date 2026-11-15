import { useState } from "react";
import { Alert, Card, Empty, Input, Tag, Typography } from "antd";
import { BlocksTable, PaymentData } from "../components/PaymentData";
import { PageTitle, QueryState, Refresh } from "../components/Common";
import { useMetadata, usePayments } from "../lib/queries";
import { validAddress } from "../lib/format";

export default function Payments({ admin = false }: { admin?: boolean }) {
  const [address, setAddress] = useState("");
  const [invalid, setInvalid] = useState(false);
  // Public requests are filtered by the API; administrators load the full ledger
  // once and filter locally.
  const payments = usePayments(admin, admin ? "" : address);
  const meta = useMetadata(admin);
  const symbol = meta.data?.coin.symbol;
  return (
    <>
      <PageTitle
        eyebrow={admin ? "PAYMENT MONITOR" : "PAYMENT RECORDS"}
        title={admin ? "支付监控" : "支付记录"}
        description={
          admin
            ? "查看全部链上最终确认的支付回执与待处理交易。"
            : "输入你的收款地址，查看余额、待确认交易和已确认支付。"
        }
        extra={<Refresh query={payments} />}
      />
      <Card className="filter-card">
        <Input.Search
          aria-label={admin ? "筛选收款地址" : "收款地址"}
          placeholder={
            admin
              ? "输入完整收款地址，筛选支付记录"
              : "输入完整收款地址查询（区分大小写）"
          }
          allowClear
          status={invalid ? "error" : undefined}
          onChange={() => setInvalid(false)}
          onSearch={(value) => {
            const next = value.trim();
            const ok = next === "" || validAddress(next);
            setInvalid(!ok);
            if (ok) setAddress(next);
          }}
          enterButton={admin ? "筛选" : "查询"}
        />
        {invalid && (
          <p className="field-error" role="alert">
            地址格式不正确（不能包含空白、/、?、#）。
          </p>
        )}
      </Card>
      <QueryState query={payments} />
      {payments.data === null && (
        <Card>
          <Empty description="当前矿池未开放支付查询" />
        </Card>
      )}
      {payments.data &&
        (admin || address ? (
          <PaymentData
            data={payments.data}
            address={address || undefined}
            symbol={symbol}
          />
        ) : (
          <div className="stack">
            {payments.data.fault && (
              <Alert
                type="warning"
                showIcon
                title="支付处理暂时延迟"
                description="矿池正在处理支付异常，余额不会丢失。"
              />
            )}
            <Card
              title="支付状态"
              extra={
                <Tag color="green">
                  已确认高度 {payments.data.finalizedHeight.toLocaleString()}
                </Tag>
              }
            >
              <div className="info-list">
                <div>
                  <span>待确认支付批次</span>
                  {payments.data.pending ? (
                    <Typography.Text
                      className="mono"
                      copyable={!!payments.data.pending.hash}
                    >
                      {payments.data.pending.hash || "尚未广播"}
                    </Typography.Text>
                  ) : (
                    <strong>无</strong>
                  )}
                </div>
                <div>
                  <span>待确认区块候选</span>
                  <strong>{payments.data.unconfirmedCandidates} 个</strong>
                </div>
              </div>
              <p className="card-subtitle">
                为保护矿工隐私，矿池不公开全部收款地址；输入你的完整地址即可查看自己的记录。
              </p>
            </Card>
            <Card title="最近结算区块">
              <BlocksTable data={payments.data} symbol={symbol} />
            </Card>
          </div>
        ))}
    </>
  );
}
