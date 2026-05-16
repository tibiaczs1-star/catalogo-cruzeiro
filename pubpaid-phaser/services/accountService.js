import { updateGameState } from "../core/gameState.js";

async function requestPubpaidJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || payload?.message || "Carteira PubPaid indisponivel agora.");
  }
  return payload;
}

export function createPubpaidPaymentTxid(prefix = "PUB") {
  const safePrefix = String(prefix || "PUB").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "PUB";
  return `${safePrefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 25);
}

export function normalizePubpaidWalletAmount(value, fallback = 0) {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const numeric = Number(normalized || value);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric * 100) / 100) : fallback;
}

export async function syncPubpaidAccount() {
  try {
    const payload = await requestPubpaidJson("./api/pubpaid/account", { method: "GET" });
    const realBalance = Number(payload?.wallet?.balanceCoins || 0);
    const availableBalance = Number(payload?.wallet?.availableCoins ?? realBalance);
    const lockedMatchBalance = Number(payload?.wallet?.lockedMatchCoins || 0);
    const lockedWithdrawalBalance = Number(payload?.wallet?.lockedWithdrawalCoins || 0);
    updateGameState({
      realBalance: Number.isFinite(realBalance) ? realBalance : 0,
      availableBalance: Number.isFinite(availableBalance) ? availableBalance : 0,
      lockedMatchBalance: Number.isFinite(lockedMatchBalance) ? lockedMatchBalance : 0,
      lockedWithdrawalBalance: Number.isFinite(lockedWithdrawalBalance) ? lockedWithdrawalBalance : 0,
      pendingDeposits: Number(payload?.pending?.deposits || 0),
      pendingWithdrawals: Number(payload?.pending?.withdrawals || 0),
      recentDeposits: Array.isArray(payload?.recentDeposits) ? payload.recentDeposits : [],
      recentWithdrawals: Array.isArray(payload?.recentWithdrawals) ? payload.recentWithdrawals : [],
      googleUser: payload?.user || null,
      walletKey: payload?.wallet?.walletKey || "",
      walletFeedback: payload?.user?.email
        ? `Carteira Google sincronizada: ${payload.user.email}.`
        : "Carteira sincronizada com a base real do PubPaid."
    });
    return payload;
  } catch (error) {
    updateGameState({
      walletFeedback: error?.message || "Entre com Google para abrir a carteira real do PubPaid."
    });
    return null;
  }
}

export async function generatePubpaidDepositPix({ amount = 10, txid = "", description = "PubPaid Creditos" } = {}) {
  const params = new URLSearchParams({
    amount: String(amount),
    txid: txid || createPubpaidPaymentTxid("PUB"),
    description
  });
  return requestPubpaidJson(`./api/pubpaid/deposit/pix?${params.toString()}`, { method: "GET" });
}

export async function registerPubpaidDeposit({ amount = 10, paymentTxid = "", sourcePage = "/pubpaid-v2.html" } = {}) {
  const payload = await requestPubpaidJson("./api/pubpaid/deposits", {
    method: "POST",
    body: JSON.stringify({
      amount,
      paymentTxid,
      sourcePage
    })
  });
  await syncPubpaidAccount();
  return payload;
}

export async function requestPubpaidWithdrawal({ amount = 0, sourcePage = "/pubpaid-v2.html" } = {}) {
  const payload = await requestPubpaidJson("./api/pubpaid/withdrawals", {
    method: "POST",
    body: JSON.stringify({
      amount,
      sourcePage
    })
  });
  await syncPubpaidAccount();
  return payload;
}

export async function joinPubpaidPvpQueue(gameId = "pool", stake = 10) {
  try {
    const response = await fetch("./api/pubpaid/pvp/join", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ gameId, stake })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error || "Nao foi possivel entrar na fila PvP."
      };
    }
    updateGameState({
      pvpStatus: payload.state || "idle",
      pvpGameId: payload.gameId || gameId,
      pvpSeat: payload.seat || "",
      pvpMatchId: payload?.match?.id || "",
      pvpMatch: payload?.match || null,
      pvpQueue: payload?.queue || null,
      objective:
        payload.state === "active"
          ? "Jogar mesa PvP ativa"
          : payload.state === "waiting"
            ? "Aguardar rival PvP"
            : "Escolher mesa PvP",
      prompt:
        payload.state === "active"
          ? `Mesa ${payload.gameId} pareada. Seu assento: ${payload.seat || "jogador"}. Escrow travado.`
          : "Fila PvP aberta. O escrow ficou travado ate parear ou sair."
    });
    await syncPubpaidAccount();
    return payload;
  } catch (_error) {
    return { ok: false, error: "Conexao com o PvP indisponivel agora." };
  }
}

export async function leavePubpaidPvpQueue(gameId = "pool") {
  try {
    const response = await fetch("./api/pubpaid/pvp/leave", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ gameId })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error || "Nao foi possivel sair da fila PvP."
      };
    }
    updateGameState({
      pvpStatus: payload.state || "idle",
      pvpGameId: payload.gameId || gameId,
      pvpSeat: payload.seat || "",
      pvpMatchId: payload?.match?.id || "",
      pvpMatch: payload?.match || null,
      pvpQueue: payload?.queue || null,
      objective: payload.state === "abandoned" ? "Reconectar antes do prazo" : "Escolher mesa PvP",
      prompt: payload.state === "idle" ? "Fila PvP cancelada. Escrow liberado." : "Estado PvP atualizado."
    });
    await syncPubpaidAccount();
    return payload;
  } catch (_error) {
    return { ok: false, error: "Conexao com o PvP indisponivel agora." };
  }
}
