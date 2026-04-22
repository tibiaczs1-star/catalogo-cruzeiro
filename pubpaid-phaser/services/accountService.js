import { updateGameState } from "../core/gameState.js";

export async function syncPubpaidAccount() {
  try {
    const response = await fetch("./api/pubpaid/account", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const realBalance = Number(payload?.wallet?.balanceCoins || 0);
    updateGameState({
      realBalance: Number.isFinite(realBalance) ? realBalance : 0
    });
    return payload;
  } catch (_error) {
    return null;
  }
}
