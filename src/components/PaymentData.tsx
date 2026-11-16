import { Alert, Card, Empty, Table, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import type { Payments } from "../lib/schemas";
import { formatNumber, formatUnits, minerPath, shorten } from "../lib/format";
import { useT } from "../i18n";

export function PaymentData({
  data,
  address,
  symbol = "",
}: {
  data: Payments | null;
  address?: string;
  symbol?: string;
}) {
  const t = useT();
  if (!data)
    return (
      <Card>
        <Empty description={t.payments.unsupported} />
        <p className="center-note">{t.payments.unsupportedHint}</p>
      </Card>
    );
  const rows = [...data.paid].reverse().flatMap((receipt, receiptIndex) =>
    receipt.outputs
      .map((output, index) => ({
        ...output,
        hash: receipt.hash,
        height: receipt.height,
        key: `${receiptIndex}-${index}`,
      }))
      .filter((output) => !address || output.address === address),
  );
  const pending =
    data.pending?.outputs.filter(
      (output) => !address || output.address === address,
    ) ?? [];
  return (
    <div className="stack">
      {data.fault && (
        <Alert
          type="error"
          showIcon
          title={t.payments.fault}
          description={data.fault}
        />
      )}
      {address && (
        <div className="balance-banner">
          <div>
            <span>{t.payments.balance}</span>
            <strong className="mono">
              {formatUnits(data.balances[address] ?? "0", data.decimals)}{" "}
              <small>{symbol}</small>
            </strong>
          </div>
          <Tag color="green">
            {t.payments.finalized(formatNumber(data.finalizedHeight))}
          </Tag>
        </div>
      )}
      {!!pending.length && (
        <Alert
          type="info"
          showIcon
          title={t.payments.pendingTitle}
          description={
            <div>
              {pending.map((output, i) => (
                <div key={i}>
                  {shorten(output.address)} ·{" "}
                  {formatUnits(output.amount, data.decimals)} {symbol}
                </div>
              ))}
              <Typography.Text className="mono" copyable={!!data.pending?.hash}>
                {data.pending?.hash || t.payments.notBroadcast}
              </Typography.Text>
            </div>
          }
        />
      )}
      <Card
        title={t.payments.confirmed}
        extra={<Tag variant="filled">{t.payments.confirmedTag}</Tag>}
      >
        <Table
          dataSource={rows}
          rowKey="key"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          scroll={{ x: 650 }}
          locale={{ emptyText: t.payments.noPayouts }}
          columns={[
            {
              title: t.payments.txHash,
              dataIndex: "hash",
              render: (hash: string) => (
                <Typography.Text
                  className="mono"
                  copyable={{ text: hash }}
                  title={hash}
                >
                  {shorten(hash)}
                </Typography.Text>
              ),
            },
            ...(!address
              ? [
                  {
                    title: t.payments.recipient,
                    dataIndex: "address",
                    render: (value: string) => (
                      <Link
                        className="mono"
                        title={value}
                        to={minerPath(value)}
                      >
                        {shorten(value)}
                      </Link>
                    ),
                  },
                ]
              : []),
            {
              title: t.payments.amount(symbol),
              dataIndex: "amount",
              render: (value: string) => (
                <strong className="mono">
                  {formatUnits(value, data.decimals)}
                </strong>
              ),
            },
            {
              title: t.payments.height,
              dataIndex: "height",
              render: (value: number) => formatNumber(value),
            },
          ]}
        />
        <p className="card-subtitle">{t.payments.receiptNote}</p>
      </Card>
    </div>
  );
}

export function BlocksTable({
  data,
  symbol = "",
}: {
  data: Payments;
  symbol?: string;
}) {
  const t = useT();
  return (
    <Table
      rowKey="hash"
      pagination={{ pageSize: 5, hideOnSinglePage: true }}
      scroll={{ x: 540 }}
      locale={{ emptyText: t.payments.noBlocks }}
      dataSource={[...data.blocks].reverse()}
      columns={[
        {
          title: t.payments.height,
          dataIndex: "height",
          render: (value: number) => formatNumber(value),
        },
        {
          title: t.payments.blockHash,
          dataIndex: "hash",
          render: (hash: string) => (
            <Typography.Text
              className="mono"
              copyable={{ text: hash }}
              title={hash}
            >
              {shorten(hash)}
            </Typography.Text>
          ),
        },
        {
          title: t.payments.reward,
          dataIndex: "reward",
          render: (value: string) => (
            <span className="mono">
              {formatUnits(value, data.decimals)} {symbol}
            </span>
          ),
        },
      ]}
    />
  );
}
