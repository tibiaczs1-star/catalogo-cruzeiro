import { updateGameState } from "../core/gameState.js";
import { syncPubpaidAccount } from "./accountService.js";

async function requestPvp(path, body = {}) {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error || "A mesa PvP nao respondeu agora."
    };
  }
  syncPvpState(payload);
  await syncPubpaidAccount();
  return payload;
}

export async function fetchPvpState(gameId = "pool") {
  try {
    const response = await fetch(`./api/pubpaid/pvp/state?gameId=${encodeURIComponent(gameId)}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-store" }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error || "Nao foi possivel ler a mesa PvP."
      };
    }
    syncPvpState(payload);
    await syncPubpaidAccount();
    return payload;
  } catch (_error) {
    return { ok: false, error: "Conexao com a mesa PvP indisponivel." };
  }
}

export async function throwDarts(matchId, aimX = 50, aimY = 50) {
  return requestPvp("./api/pubpaid/pvp/darts/throw", { matchId, aimX, aimY });
}

export async function moveCheckers(matchId, move) {
  return requestPvp("./api/pubpaid/pvp/checkers/move", { matchId, move });
}

export async function shootPool(matchId, angle = 0, power = 0.5) {
  return requestPvp("./api/pubpaid/pvp/pool/shot", { matchId, angle, power });
}

export async function drawPoker(matchId, held = []) {
  return requestPvp("./api/pubpaid/pvp/poker/draw", { matchId, held });
}

export async function guessDicecups(matchId, guess) {
  return requestPvp("./api/pubpaid/pvp/dicecups/guess", { matchId, guess });
}

export async function playTrucoCard(matchId, cardIndex) {
  return requestPvp("./api/pubpaid/pvp/truco/play", { matchId, cardIndex });
}

export async function moveChess(matchId, from, to, promotion = "q") {
  return requestPvp("./api/pubpaid/pvp/chess/move", { matchId, from, to, promotion });
}

export async function confirmPvpReady(matchId, gameId = "checkers") {
  return requestPvp("./api/pubpaid/pvp/ready", { matchId, gameId });
}

export function syncPvpState(payload = {}) {
  updateGameState({
    pvpStatus: payload.state || "idle",
    pvpGameId: payload.gameId || "",
    pvpSeat: payload.seat || "",
    pvpMatchId: payload?.match?.id || "",
    pvpMatch: payload?.match || null,
    pvpQueue: payload?.queue || null
  });
}
