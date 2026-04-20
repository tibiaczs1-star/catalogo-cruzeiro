import { cn } from "@/lib/utils";
import { type BetType, betKey, colorOf } from "@/lib/roulette";

interface Props {
  bets: Map<string, number>;
  onPlace: (type: BetType) => void;
}

const NUMBERS_GRID: number[][] = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

function ChipBadge({ amount }: { amount: number }) {
  if (!amount) return null;
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
      <div
        className="rounded-full bg-gold-gradient text-[10px] font-bold flex items-center justify-center shadow-chip border-2 border-dashed border-white/70"
        style={{ width: "26px", height: "26px", color: "oklch(0.18 0.02 150)" }}
      >
        {amount}
      </div>
    </div>
  );
}

export function BettingTable({ bets, onPlace }: Props) {
  const cellBase =
    "relative border border-gold/40 flex items-center justify-center font-bold text-white cursor-pointer transition-all hover:brightness-125 hover:z-10";

  const numCell = (n: number) => {
    const color = colorOf(n);
    const bg =
      color === "red" ? "var(--roulette-red)" : "var(--roulette-black)";
    const type: BetType = { kind: "number", value: n };
    const amt = bets.get(betKey(type)) ?? 0;
    return (
      <div
        key={n}
        className={cn(cellBase, "h-10 text-sm")}
        style={{ background: bg }}
        onClick={() => onPlace(type)}
      >
        {n}
        <ChipBadge amount={amt} />
      </div>
    );
  };

  const outsideCell = (
    label: string,
    type: BetType,
    extraClass = "",
  ) => {
    const amt = bets.get(betKey(type)) ?? 0;
    const isRed = type.kind === "color" && type.value === "red";
    const isBlack = type.kind === "color" && type.value === "black";
    const bg = isRed
      ? "var(--roulette-red)"
      : isBlack
        ? "var(--roulette-black)"
        : "var(--felt-dark)";
    return (
      <div
        className={cn(cellBase, "h-10 text-xs uppercase tracking-wider", extraClass)}
        style={{ background: bg }}
        onClick={() => onPlace(type)}
      >
        {label}
        <ChipBadge amount={amt} />
      </div>
    );
  };

  return (
    <div className="bg-felt rounded-xl p-3 shadow-deep border-2 border-gold/30">
      <div className="grid grid-cols-[40px_repeat(12,1fr)_50px] gap-0">
        {/* Zero spans 3 rows */}
        <div
          className={cn(cellBase, "row-span-3 text-lg")}
          style={{ background: "var(--roulette-green)" }}
          onClick={() => onPlace({ kind: "number", value: 0 })}
        >
          0
          <ChipBadge amount={bets.get(betKey({ kind: "number", value: 0 })) ?? 0} />
        </div>

        {NUMBERS_GRID.map((row, rowIdx) => {
          const colNum = (3 - rowIdx) as 1 | 2 | 3;
          return (
            <div key={rowIdx} className="contents">
              {row.map((n) => numCell(n))}
              {outsideCell(`2:1`, { kind: "column", value: colNum }, "text-[10px]")}
            </div>
          );
        })}

        {/* Spacer row */}
        <div />
        <div className="col-span-4">
          {outsideCell("1st 12", { kind: "dozen", value: 1 })}
        </div>
        <div className="col-span-4">
          {outsideCell("2nd 12", { kind: "dozen", value: 2 })}
        </div>
        <div className="col-span-4">
          {outsideCell("3rd 12", { kind: "dozen", value: 3 })}
        </div>
        <div />

        {/* Outside bets */}
        <div />
        <div className="col-span-2">
          {outsideCell("1-18", { kind: "range", value: "low" })}
        </div>
        <div className="col-span-2">
          {outsideCell("Even", { kind: "parity", value: "even" })}
        </div>
        <div className="col-span-2">
          {outsideCell("Red", { kind: "color", value: "red" })}
        </div>
        <div className="col-span-2">
          {outsideCell("Black", { kind: "color", value: "black" })}
        </div>
        <div className="col-span-2">
          {outsideCell("Odd", { kind: "parity", value: "odd" })}
        </div>
        <div className="col-span-2">
          {outsideCell("19-36", { kind: "range", value: "high" })}
        </div>
        <div />
      </div>
    </div>
  );
}
