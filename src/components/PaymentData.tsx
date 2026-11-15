import { Alert, Card, Empty, Table, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import type { Payments } from "../lib/schemas";
import { formatUnits, minerPath, shorten } from "../lib/format";

export function PaymentData({
  data,
  address,
  symbol = "",
}: {
  data: Payments | null;
  address?: string;
  symbol?: string;
}) {
  if (!data)
    return (
      <Card>
        <Empty description="当前矿池未开放支付查询" />
        <p className="center-note">支付记录将在矿池提供查询接口后显示。</p>
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
          title="支付处理异常"
          description={data.fault}
        />
      )}
      {address && (
        <div className="balance-banner">
          <div>
            <span>待结算余额</span>
            <strong className="mono">
              {formatUnits(data.balances[address] ?? "0", data.decimals)}{" "}
              <small>{symbol}</small>
            </strong>
          </div>
          <Tag color="green">
            已确认高度 {data.finalizedHeight.toLocaleString()}
          </Tag>
        </div>
      )}
      {!!pending.length && (
        <Alert
          type="info"
          showIcon
          title="有支付正在等待确认"
          description={
            <div>
              {pending.map((output, i) => (
                <div key={i}>
                  {shorten(output.address)} ·{" "}
                  {formatUnits(output.amount, data.decimals)} {symbol}
                </div>
              ))}
              <Typography.Text className="mono" copyable={!!data.pending?.hash}>
                {data.pending?.hash || "尚未广播"}
              </Typography.Text>
            </div>
          }
        />
      )}
      <Card title="已确认支付" extra={<Tag variant="filled">最终确认</Tag>}>
        <Table
          dataSource={rows}
          rowKey="key"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          scroll={{ x: 650 }}
          locale={{ emptyText: "暂无已确认支付" }}
          columns={[
            {
              title: "交易哈希",
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
                    title: "收款矿工",
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
              title: `金额 ${symbol}`,
              dataIndex: "amount",
              render: (value: string) => (
                <strong className="mono">
                  {formatUnits(value, data.decimals)}
                </strong>
              ),
            },
            {
              title: "确认高度",
              dataIndex: "height",
              render: (value: number) => value.toLocaleString(),
            },
          ]}
        />
        <p className="card-subtitle">
          展示接口保留的最近最多 100 笔交易回执，金额按最小单位精确换算。
        </p>
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
  return (
    <Table
      rowKey="hash"
      pagination={{ pageSize: 5, hideOnSinglePage: true }}
      scroll={{ x: 540 }}
      locale={{ emptyText: "暂无已结算区块" }}
      dataSource={[...data.blocks].reverse()}
      columns={[
        {
          title: "高度",
          dataIndex: "height",
          render: (value: number) => value.toLocaleString(),
        },
        {
          title: "区块哈希",
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
          title: "奖励",
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
