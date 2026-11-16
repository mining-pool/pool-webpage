import { z } from "zod";

const list = <T extends z.ZodType>(item: T) =>
  z
    .array(item)
    .nullish()
    .transform((v) => v ?? []);
const map = <T extends z.ZodType>(item: T) =>
  z
    .record(z.string(), item)
    .nullish()
    .transform((v) => v ?? {});
const number = z.number().finite().nonnegative();
const rateFields = {
  // "H/s" or "Sol/s"; older APIs sent difficulty per second with no unit.
  hashrateUnit: z.string().max(16).default("diff/s"),
  hashrate1min: number,
  hashrate30min: number,
  hashrate1h: number,
  hashrate6h: number,
  hashrate1d: number,
};
export const poolSchema = z
  .object({
    ...rateFields,
    coinName: z.string(),
    // The address list is only returned to administrators.
    miners: list(z.string()),
    minerCount: number.optional(),
  })
  .transform((pool) => ({
    ...pool,
    minerCount: pool.minerCount ?? pool.miners.length,
  }));
export const minerSchema = z.object({
  ...rateFields,
  name: z.string(),
  roundContrib: number,
  rigs: list(z.string()),
});
export const rigSchema = z.object({
  ...rateFields,
  name: z.string(),
  minerName: z.string(),
});
export const coinSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  testnet: z.boolean().optional(),
});
export const algorithmSchema = z.object({
  name: z.string(),
  multiplier: z.number().optional(),
});
export const portsSchema = z.record(
  z.string(),
  z.object({
    protocol: z.string().optional(),
    diff: number,
    varDiff: z
      .object({ minDiff: number, maxDiff: number, targetTime: number })
      .nullish(),
    // Current API: boolean. Older APIs sent the TLS options object or null.
    tls: z
      .unknown()
      .transform((value) =>
        typeof value === "boolean" ? value : value != null,
      ),
  }),
);
const units = z.string().regex(/^\d+$/, "amount must be an integer string");
const output = z.object({ address: z.string(), amount: units });
export const paymentsSchema = z.object({
  decimals: z.number().int().min(0).max(30),
  finalizedHeight: number,
  balances: map(units),
  pending: z
    .object({
      id: z.string(),
      hash: z.string().optional(),
      outputs: list(output),
    })
    .nullish(),
  paid: list(
    z.object({ hash: z.string(), height: number, outputs: list(output) }),
  ),
  blocks: list(z.object({ hash: z.string(), height: number, reward: units })),
  unconfirmedCandidates: number,
  fault: z.string().nullish(),
});
export type Rates = z.infer<typeof poolSchema>;
export type Miner = z.infer<typeof minerSchema>;
export type Rig = z.infer<typeof rigSchema>;
export type Payments = z.infer<typeof paymentsSchema>;
