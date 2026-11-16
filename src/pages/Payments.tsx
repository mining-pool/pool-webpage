import { useState } from "react";
import { Alert, Card, Empty, Input, Tag, Typography } from "antd";
import { BlocksTable, PaymentData } from "../components/PaymentData";
import { PageTitle, QueryState, Refresh } from "../components/Common";
import { useMetadata, usePayments } from "../lib/queries";
import { formatNumber, validAddress } from "../lib/format";
import { useT } from "../i18n";

export default function Payments({ admin = false }: { admin?: boolean }) {
  const [address, setAddress] = useState("");
  const [invalid, setInvalid] = useState(false);
  // Public requests are filtered by the API; administrators load the full ledger
  // once and filter locally.
  const payments = usePayments(admin, admin ? "" : address);
  const meta = useMetadata(admin);
  const t = useT();
  const symbol = meta.data?.coin.symbol;
  return (
    <>
      <PageTitle
        eyebrow={admin ? t.payments.adminEyebrow : t.payments.eyebrow}
        title={admin ? t.payments.adminTitle : t.payments.title}
        description={
          admin ? t.payments.adminDescription : t.payments.description
        }
        extra={<Refresh query={payments} />}
      />
      <Card className="filter-card">
        <Input.Search
          aria-label={
            admin ? t.payments.adminFilterLabel : t.payments.filterLabel
          }
          placeholder={
            admin ? t.payments.adminPlaceholder : t.payments.placeholder
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
          enterButton={admin ? t.payments.adminSubmit : t.payments.submit}
        />
        {invalid && (
          <p className="field-error" role="alert">
            {t.payments.invalid}
          </p>
        )}
      </Card>
      <QueryState query={payments} />
      {payments.data === null && (
        <Card>
          <Empty description={t.payments.unsupported} />
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
                title={t.payments.delayed}
                description={t.payments.delayedHint}
              />
            )}
            <Card
              title={t.payments.statusTitle}
              extra={
                <Tag color="green">
                  {t.payments.finalized(
                    formatNumber(payments.data.finalizedHeight),
                  )}
                </Tag>
              }
            >
              <div className="info-list">
                <div>
                  <span>{t.payments.pendingBatch}</span>
                  {payments.data.pending ? (
                    <Typography.Text
                      className="mono"
                      copyable={!!payments.data.pending.hash}
                    >
                      {payments.data.pending.hash || t.payments.notBroadcast}
                    </Typography.Text>
                  ) : (
                    <strong>{t.common.none}</strong>
                  )}
                </div>
                <div>
                  <span>{t.payments.candidates}</span>
                  <strong>
                    {formatNumber(payments.data.unconfirmedCandidates)}
                  </strong>
                </div>
              </div>
              <p className="card-subtitle">{t.payments.privacy}</p>
            </Card>
            <Card title={t.payments.blocks}>
              <BlocksTable data={payments.data} symbol={symbol} />
            </Card>
          </div>
        ))}
    </>
  );
}
