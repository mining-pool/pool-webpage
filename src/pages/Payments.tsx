import { useState } from "react";
import { Card, Input } from "antd";
import { PaymentData } from "../components/PaymentData";
import { PageTitle, QueryState, Refresh } from "../components/Common";
import { useMetadata, usePayments } from "../lib/queries";

export default function Payments({ admin = false }: { admin?: boolean }) {
  const payments = usePayments(admin);
  const meta = useMetadata(admin);
  const [address, setAddress] = useState("");
  return (
    <>
      <PageTitle
        eyebrow={admin ? "PAYMENT MONITOR" : "PAYMENT RECORDS"}
        title={admin ? "支付监控" : "支付记录"}
        description="查看链上最终确认的支付回执与待处理交易。"
        extra={<Refresh query={payments} />}
      />
      <Card className="filter-card">
        <Input.Search
          aria-label="筛选收款地址"
          placeholder="输入完整收款地址，筛选支付记录"
          allowClear
          onSearch={(value) => setAddress(value.trim())}
          enterButton="筛选"
        />
      </Card>
      <QueryState query={payments} />
      {payments.data !== undefined && (
        <PaymentData
          data={payments.data}
          address={address || undefined}
          symbol={meta.data?.coin.symbol}
        />
      )}
    </>
  );
}
