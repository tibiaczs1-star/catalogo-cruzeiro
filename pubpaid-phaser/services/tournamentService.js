async function requestTournamentJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    return {
      ...(payload || {}),
      ok: false,
      error: payload?.error || "Torneio indisponivel agora."
    };
  }
  return payload;
}

function tournamentTestEnabled() {
  const params = new URLSearchParams(window.location.search || "");
  return params.has("tournamentTest") || params.get("torneioTeste") === "1";
}

export function isCheckersTournamentTestMode() {
  return tournamentTestEnabled();
}

export async function fetchCheckersTournamentState(key = "", options = {}) {
  const params = new URLSearchParams();
  if (key) params.set("key", key);
  if (options.testMode ?? tournamentTestEnabled()) params.set("test", "1");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestTournamentJson(`./api/pubpaid/tournaments/checkers/state${suffix}`, { method: "GET" });
}

export async function joinCheckersTournament({ key = "", name = "", testMode = tournamentTestEnabled() } = {}) {
  return requestTournamentJson("./api/pubpaid/tournaments/checkers/join", {
    method: "POST",
    body: JSON.stringify({ key, name, testMode })
  });
}

export async function registerCheckersTournament({
  key = "",
  name = "",
  whatsapp = "",
  depositorName = "",
  email = "",
  testMode = tournamentTestEnabled()
} = {}) {
  return requestTournamentJson("./api/pubpaid/tournaments/checkers/register", {
    method: "POST",
    body: JSON.stringify({ key, slotKey: key, name, whatsapp, depositorName, email, testMode })
  });
}

export async function startCheckersTournamentTest({ key = "", testMode = tournamentTestEnabled() } = {}) {
  return requestTournamentJson("./api/pubpaid/tournaments/checkers/start", {
    method: "POST",
    body: JSON.stringify({ key, testMode })
  });
}

export async function moveCheckersTournament({ key = "", matchId = "", move = {}, testMode = tournamentTestEnabled() } = {}) {
  return requestTournamentJson("./api/pubpaid/tournaments/checkers/move", {
    method: "POST",
    body: JSON.stringify({ key, matchId, move, testMode })
  });
}

export async function advanceCheckersTournamentTest({
  key = "",
  winnerKey = "",
  matchId = "",
  testMode = tournamentTestEnabled()
} = {}) {
  return requestTournamentJson("./api/pubpaid/tournaments/checkers/test/advance", {
    method: "POST",
    body: JSON.stringify({ key, winnerKey, matchId, testMode })
  });
}
