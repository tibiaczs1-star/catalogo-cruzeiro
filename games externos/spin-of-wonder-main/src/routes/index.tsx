import { createFileRoute } from "@tanstack/react-router";
import { RouletteGame } from "@/components/RouletteGame";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Royal Roulette — Jogo de Roleta Online" },
      {
        name: "description",
        content:
          "Jogue roleta europeia online: apostas em números, cores, dúzias e mais. Visual de cassino premium com animações realistas.",
      },
      { property: "og:title", content: "Royal Roulette — Jogo de Roleta Online" },
      {
        property: "og:description",
        content:
          "Roleta europeia com fichas, apostas múltiplas e animações realistas.",
      },
    ],
  }),
});

function Index() {
  return (
    <>
      <RouletteGame />
      <Toaster theme="dark" position="top-center" />
    </>
  );
}
