import { useCallback, useEffect, useMemo, useState } from "react";
import { RouletteWheel } from "./RouletteWheel";
import { BettingTable } from "./BettingTable";
import { Chip } from "./Chip";
import { Button } from "@/components/ui/button";
import {
  type BetType,
  betKey,
  betWins,
  colorOf,
  payoutMultiplier,
} from "@/lib/roulette";
import { toast } from "sonner";

const STORAGE_KEY = "roulette-balance-v1";
const CHIP_VALUES = [1, 5, 25, 100, 500];
const STARTING_BALANCE = 1000;

type Phase = "betting" | "spinning" | "result";

export function RouletteGame() {
  const [balance, setBalance] = useState<number>(STARTING_BALANCE);
  const [bets, setBets] = useState<Map<string, { type: BetType; amount: number }>>(
    new Map(),
  );
  const [chipValue, setChipValue] = useState(5);
  const [phase, setPhase] = useState<Phase>("betting");
  const [result, setResult] = useState<number | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);

  // Load balance from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const v = parseInt(saved, 10);
        if (!Number.isNaN(v) && v > 0) setBalance(v);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(balance));
    } catch {
      /* ignore */
    }
  }, [balance]);

  const totalBet = useMemo(
    () => Array.from(bets.values()).reduce((s, b) => s + b.amount, 0),
    [bets],
  );

  const betsAmountMap = useMemo(() => {
    const m = new Map<string, number>();
    bets.forEach((b, k) => m.set(k, b.amount));
    return m;
  }, [bets]);

  const placeBet = useCallback(
    (type: BetType) => {
      if (phase !== "betting") return;
      if (balance < chipValue) {
        toast.error("Saldo insuficiente!");
        return;
      }
      const key = betKey(type);
      setBets((prev) => {
        const next = new Map(prev);
        const existing = next.get(key);
        next.set(key, {
          type,
          amount: (existing?.amount ?? 0) + chipValue,
        });
        return next;
      });
      setBalance((b) => b - chipValue);
    },
    [balance, chipValue, phase],
  );

  const clearBets = useCallback(() => {
    if (phase !== "betting") return;
    setBalance((b) => b + totalBet);
    setBets(new Map());
  }, [totalBet, phase]);

  const spin = useCallback(() => {
    if (phase !== "betting") return;
    if (bets.size === 0) {
      toast.error("Faça pelo menos uma aposta!");
      return;
    }
    const winningNumber = Math.floor(Math.random() * 37);
    setResult(winningNumber);
    setSpinId((id) => id + 1);
    setPhase("spinning");

    // Resolve after animation
    window.setTimeout(() => {
      let winnings = 0;
      bets.forEach(({ type, amount }) => {
        if (betWins(type, winningNumber)) {
          winnings += amount + amount * payoutMultiplier(type);
        }
      });
      setBalance((b) => b + winnings);
      setLastWin(winnings);
      setHistory((h) => [winningNumber, ...h].slice(0, 12));
      setBets(new Map());
      setPhase("result");

      if (winnings > 0) {
        toast.success(`🎉 Você ganhou ${winnings} fichas!`);
      } else {
        toast(`Número ${winningNumber} (${colorOf(winningNumber)})`, {
          description: "Boa sorte na próxima!",
        });
      }
    }, 6200);
  }, [bets, phase]);

  const newRound = useCallback(() => {
    setPhase("betting");
    setLastWin(null);
  }, []);

  const resetBalance = useCallback(() => {
    setBalance(STARTING_BALANCE);
    setBets(new Map());
    setPhase("betting");
    setLastWin(null);
    toast.success("Saldo resetado para 1000 fichas");
  }, []);

  return (
    <div className="min-h-screen w-full px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1
            className="text-4xl md:text-5xl font-bold tracking-wider bg-gold-gradient bg-clip-text text-transparent"
            style={{ WebkitBackgroundClip: "text" }}
          >
            ROYAL ROULETTE
          </h1>
          <p className="text-muted-foreground text-sm mt-2 tracking-widest uppercase">
            European · Single Zero
          </p>
        </header>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
          {/* Left: Wheel + status */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-deep border border-gold/20">
              <RouletteWheel
                spinning={phase === "spinning"}
                result={result}
                spinId={spinId}
              />

              {/* Result display */}
              <div className="mt-6 text-center min-h-[60px]">
                {phase === "result" && result !== null ? (
                  <div className="space-y-2 animate-in fade-in zoom-in duration-500">
                    <div
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold text-white shadow-gold"
                      style={{
                        background:
                          colorOf(result) === "red"
                            ? "var(--roulette-red)"
                            : colorOf(result) === "black"
                              ? "var(--roulette-black)"
                              : "var(--roulette-green)",
                      }}
                    >
                      {result}
                    </div>
                    {lastWin !== null && (
                      <p
                        className={`text-lg font-semibold ${lastWin > 0 ? "text-gold" : "text-muted-foreground"}`}
                      >
                        {lastWin > 0 ? `+${lastWin} fichas` : "Sem prêmio"}
                      </p>
                    )}
                  </div>
                ) : phase === "spinning" ? (
                  <p className="text-gold font-semibold tracking-widest animate-pulse">
                    GIRANDO...
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Faça suas apostas e gire a roleta
                  </p>
                )}
              </div>
            </div>

            {/* History */}
            <div className="bg-card rounded-xl p-4 border border-gold/20">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Últimos números
              </h3>
              <div className="flex gap-2 flex-wrap min-h-[36px]">
                {history.length === 0 && (
                  <span className="text-xs text-muted-foreground/60">—</span>
                )}
                {history.map((n, i) => (
                  <div
                    key={`${i}-${n}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      background:
                        colorOf(n) === "red"
                          ? "var(--roulette-red)"
                          : colorOf(n) === "black"
                            ? "var(--roulette-black)"
                            : "var(--roulette-green)",
                      opacity: 1 - i * 0.06,
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Betting */}
          <div className="space-y-6">
            {/* Balance + actions */}
            <div className="bg-card rounded-xl p-5 border border-gold/20 shadow-deep">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Saldo
                  </p>
                  <p className="text-3xl font-bold text-gold">
                    {balance.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Aposta atual
                  </p>
                  <p className="text-2xl font-bold">{totalBet}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={spin}
                  disabled={phase !== "betting" || bets.size === 0}
                  className="flex-1 bg-gold-gradient text-primary-foreground font-bold tracking-widest uppercase hover:opacity-90 shadow-gold h-11"
                >
                  Girar
                </Button>
                {phase === "result" ? (
                  <Button
                    onClick={newRound}
                    variant="outline"
                    className="border-gold/40 hover:bg-gold/10 h-11"
                  >
                    Nova rodada
                  </Button>
                ) : (
                  <Button
                    onClick={clearBets}
                    variant="outline"
                    disabled={phase !== "betting" || bets.size === 0}
                    className="border-gold/40 hover:bg-gold/10 h-11"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {balance === 0 && (
                <Button
                  onClick={resetBalance}
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-gold"
                >
                  Sem fichas? Resetar saldo
                </Button>
              )}
            </div>

            {/* Chip selector */}
            <div className="bg-card rounded-xl p-4 border border-gold/20">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Selecione o valor da ficha
              </h3>
              <div className="flex gap-3 justify-center">
                {CHIP_VALUES.map((v) => (
                  <Chip
                    key={v}
                    value={v}
                    selected={chipValue === v}
                    onClick={() => setChipValue(v)}
                  />
                ))}
              </div>
            </div>

            {/* Betting table */}
            <BettingTable bets={betsAmountMap} onPlace={placeBet} />

            <p className="text-xs text-center text-muted-foreground">
              Pagamentos: número 35:1 · dúzia/coluna 2:1 · cores/par-ímpar/metade 1:1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
