import { useEffect, useMemo, useRef, useState } from "react";
import { WHEEL_ORDER, colorOf } from "@/lib/roulette";

interface Props {
  spinning: boolean;
  result: number | null;
  spinId: number; // increments on each spin to trigger animation
}

const SLOT_COUNT = WHEEL_ORDER.length; // 37
const SLOT_DEG = 360 / SLOT_COUNT;

export function RouletteWheel({ spinning, result, spinId }: Props) {
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const lastSpinRef = useRef(0);

  useEffect(() => {
    if (spinId === 0 || spinId === lastSpinRef.current) return;
    lastSpinRef.current = spinId;

    if (result === null) return;

    const slotIndex = WHEEL_ORDER.indexOf(result);
    // Wheel spins clockwise; ball rests at top (0deg). We rotate wheel so the
    // target slot ends at top.
    const targetWheelDeg = -(slotIndex * SLOT_DEG);
    const wheelTurns = 5 * 360;
    setWheelRotation((prev) => {
      // Find next angle >= prev + wheelTurns ending at targetWheelDeg mod 360
      const base = prev + wheelTurns;
      const currentMod = ((base % 360) + 360) % 360;
      const targetMod = ((targetWheelDeg % 360) + 360) % 360;
      let delta = targetMod - currentMod;
      if (delta < 0) delta += 360;
      return base + delta;
    });

    // Ball spins counter-clockwise more turns
    const ballTurns = -8 * 360;
    setBallRotation((prev) => prev + ballTurns + (Math.random() * 60 - 30));
  }, [spinId, result]);

  const numbers = useMemo(
    () =>
      WHEEL_ORDER.map((n, i) => {
        const angle = i * SLOT_DEG;
        const color = colorOf(n);
        const bg =
          color === "red"
            ? "var(--roulette-red)"
            : color === "black"
              ? "var(--roulette-black)"
              : "var(--roulette-green)";
        return { n, angle, bg };
      }),
    [],
  );

  return (
    <div className="relative aspect-square w-full max-w-[420px] mx-auto select-none">
      {/* Outer rim */}
      <div className="absolute inset-0 rounded-full bg-gold-gradient shadow-deep" />
      <div
        className="absolute rounded-full"
        style={{
          inset: "3%",
          background:
            "radial-gradient(circle at 30% 30%, oklch(0.35 0.05 60), oklch(0.18 0.03 60))",
        }}
      />

      {/* Spinning wheel */}
      <div
        className="absolute rounded-full roulette-spin"
        style={{
          inset: "7%",
          transform: `rotate(${wheelRotation}deg)`,
          background:
            "radial-gradient(circle, oklch(0.25 0.04 150) 0%, oklch(0.15 0.02 150) 100%)",
          boxShadow:
            "inset 0 0 30px oklch(0 0 0 / 60%), 0 0 0 2px oklch(0.78 0.15 85 / 60%)",
        }}
      >
        {numbers.map(({ n, angle, bg }) => (
          <div
            key={n}
            className="absolute inset-0"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            {/* Slot wedge */}
            <div
              className="absolute left-1/2 top-0 h-1/2 origin-bottom"
              style={{
                width: `${(2 * Math.PI * 50) / SLOT_COUNT}%`,
                transform: "translateX(-50%)",
                background: bg,
                clipPath: "polygon(20% 0, 80% 0, 100% 100%, 0 100%)",
              }}
            />
            {/* Number label */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold text-white"
              style={{ top: "6%" }}
            >
              {n}
            </div>
          </div>
        ))}

        {/* Inner hub */}
        <div
          className="absolute rounded-full bg-gold-gradient"
          style={{
            inset: "30%",
            boxShadow:
              "inset 0 2px 6px oklch(1 0 0 / 30%), inset 0 -2px 6px oklch(0 0 0 / 40%), 0 0 20px oklch(0 0 0 / 50%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: "42%",
            background:
              "radial-gradient(circle, oklch(0.25 0.05 60), oklch(0.12 0.02 60))",
          }}
        />
      </div>

      {/* Ball track */}
      <div
        className="absolute rounded-full ball-spin pointer-events-none"
        style={{
          inset: "9%",
          transform: `rotate(${ballRotation}deg)`,
        }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            top: "2%",
            width: "14px",
            height: "14px",
            background:
              "radial-gradient(circle at 30% 30%, oklch(1 0 0), oklch(0.7 0 0))",
            boxShadow:
              "0 2px 4px oklch(0 0 0 / 60%), inset 0 -1px 2px oklch(0 0 0 / 30%)",
          }}
        />
      </div>

      {/* Top pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{ top: "-2%" }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "16px solid var(--gold)",
            filter: "drop-shadow(0 2px 2px oklch(0 0 0 / 50%))",
          }}
        />
      </div>

      {spinning && (
        <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
