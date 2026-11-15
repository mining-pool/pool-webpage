// Opt-in preview fixtures only. Never used as fallback for live requests.
export const demoAddress = "qtc1nomp7m4x2demo8wallet9address5k6v3";
const rates = {
  hashrate1min: 1842.36,
  hashrate30min: 1791.82,
  hashrate1h: 1816.24,
  hashrate6h: 1750.61,
  hashrate1d: 1682.47,
};
const miners = [
  demoAddress,
  ...Array.from(
    { length: 11 },
    (_, i) => `qtc1sample${String(i + 1).padStart(2, "0")}8m4x9p7z2k6v3n5w`,
  ),
];
const scale = (n: number) =>
  Object.fromEntries(Object.entries(rates).map(([k, v]) => [k, v / n]));
type Output = { address: string; amount: string };

const ledger = {
  decimals: 12,
  finalizedHeight: 284192,
  unconfirmedCandidates: 3,
  fault: "",
  balances: { [demoAddress]: "1258300000000", [miners[1]]: "734900000000" },
  pending: {
    id: "demo-batch-42",
    hash: "0x98f1a24e7b8234d5913a28eb4c8907d2",
    outputs: [
      { address: demoAddress, amount: "400000000000" },
      { address: miners[1], amount: "210000000000" },
    ],
  },
  paid: Array.from({ length: 7 }, (_, i) => ({
    hash: `0x76a93bf52e86d410a48906dcb3710${i}f2485e`,
    height: 284100 - i * 82,
    outputs: [
      {
        address: i % 3 === 0 ? miners[1] : demoAddress,
        amount: `${(i + 1) * 312}000000000`,
      },
    ],
  })),
  blocks: Array.from({ length: 5 }, (_, i) => ({
    hash: `0xabc48e072abced71389420fca2${i}46de983`,
    height: 284110 - i * 24,
    reward: "5000000000000",
  })),
};

// Mirrors the Go API privacy rules (api/privacy.go): only administrators see
// other miners' addresses.
function payments(admin: boolean, address: string) {
  if (admin) return ledger;
  const mine = (outputs: Output[]) =>
    outputs.filter((output) => output.address === address);
  const pending = ledger.pending && {
    ...ledger.pending,
    outputs: mine(ledger.pending.outputs),
  };
  return {
    ...ledger,
    balances:
      address in ledger.balances
        ? {
            [address]: ledger.balances[address as keyof typeof ledger.balances],
          }
        : {},
    pending: address ? (pending.outputs.length ? pending : null) : pending,
    paid: ledger.paid
      .map((receipt) => ({ ...receipt, outputs: mine(receipt.outputs) }))
      .filter((receipt) => receipt.outputs.length),
  };
}

export function demoResponse(fullPath: string, admin = false): unknown {
  const [path, search = ""] = fullPath.split("?");
  if (path === "/")
    return [
      "/",
      "/pool",
      "/config",
      "/config/coin",
      "/config/algorithm",
      "/config/ports",
      "/miner/{miner}",
      "/miner/{miner}/rig/{rig}",
      "/payments",
    ];
  if (path === "/pool")
    return admin
      ? { ...rates, coinName: "Quantus", miners, minerCount: miners.length }
      : { ...rates, coinName: "Quantus", minerCount: miners.length };
  if (path === "/config/coin")
    return { name: "Quantus", symbol: "QTC", testnet: true };
  if (path === "/config/algorithm") return { name: "poseidon2", multiplier: 1 };
  if (path === "/config/ports")
    return {
      "3333": { protocol: "stratum", diff: 1, varDiff: null, tls: null },
      "4444": { protocol: "stratum", diff: 8, varDiff: null, tls: {} },
    };
  if (path === "/payments")
    return payments(admin, new URLSearchParams(search).get("address") ?? "");
  const parts = path.split("/").map(decodeURIComponent);
  if (parts[1] === "miner" && parts[3] === "rig")
    return {
      ...scale(parts[4] === "worker-03" ? Infinity : 36),
      name: parts[4],
      minerName: parts[2],
    };
  if (parts[1] === "miner") {
    const known = miners.includes(parts[2]);
    return {
      ...scale(known ? 12 : Infinity),
      name: parts[2],
      roundContrib: known ? 12840 : 0,
      rigs: known ? ["worker-01", "worker-02", "worker-03"] : [],
    };
  }
  throw new Error(`No demo fixture: ${path}`);
}
