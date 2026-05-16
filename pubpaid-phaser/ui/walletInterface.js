import {
  createPubpaidPaymentTxid,
  generatePubpaidDepositPix,
  normalizePubpaidWalletAmount,
  registerPubpaidDeposit,
  requestPubpaidWithdrawal,
  syncPubpaidAccount
} from "../services/accountService.js";
import { gameState, subscribeGameState, updateGameState } from "../core/gameState.js";

const DEPOSIT_AMOUNTS = new Set([5, 10, 20, 50, 100]);

function text(node, value) {
  if (node) node.textContent = String(value ?? "");
}

function html(node, value) {
  if (node) node.innerHTML = String(value ?? "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function formatCoins(value) {
  const numeric = Number(value || 0);
  return numeric.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

function getGoogleUser() {
  try {
    return window.CatalogoGoogleAuth?.getUser?.() || null;
  } catch (_error) {
    return null;
  }
}

function getDepositAmount(select) {
  const amount = Number(select?.value || 0);
  return DEPOSIT_AMOUNTS.has(amount) ? amount : 0;
}

function buildHistory(items = [], emptyLabel = "Sem movimento recente.") {
  if (!items.length) return `<li>${escapeHtml(emptyLabel)}</li>`;
  return items.slice(0, 4).map((item) => {
    const amount = Number(item.creditsRequested || item.amount || 0);
    const status = item.paymentStatus || item.status || "pendente";
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "";
    return `<li><strong>${formatCoins(amount)}</strong><span>${escapeHtml(status)}${date ? ` · ${escapeHtml(date)}` : ""}</span></li>`;
  }).join("");
}

export function bindWalletInterface() {
  const refs = {
    root: document.querySelector("[data-dom-wallet]"),
    openButtons: Array.from(document.querySelectorAll("[data-dom-open-wallet]")),
    closeButtons: Array.from(document.querySelectorAll("[data-dom-close-wallet]")),
    refreshButtons: Array.from(document.querySelectorAll("[data-dom-refresh-wallet]")),
    balance: document.querySelector("[data-wallet-balance]"),
    available: document.querySelector("[data-wallet-available]"),
    lockedMatch: document.querySelector("[data-wallet-locked-match]"),
    lockedWithdrawal: document.querySelector("[data-wallet-locked-withdrawal]"),
    pending: document.querySelector("[data-wallet-pending]"),
    feedback: document.querySelector("[data-wallet-feedback]"),
    depositAmount: document.querySelector("[data-wallet-deposit-amount]"),
    depositorName: document.querySelector("[data-wallet-depositor-name]"),
    generateDeposit: document.querySelector("[data-wallet-generate-deposit]"),
    registerDeposit: document.querySelector("[data-wallet-register-deposit]"),
    qr: document.querySelector("[data-wallet-pix-qr]"),
    withdrawalAmount: document.querySelector("[data-wallet-withdrawal-amount]"),
    requestWithdrawal: document.querySelector("[data-wallet-request-withdrawal]"),
    deposits: document.querySelector("[data-wallet-recent-deposits]"),
    withdrawals: document.querySelector("[data-wallet-recent-withdrawals]")
  };

  if (!refs.root) return;

  const local = {
    txid: "",
    qrReady: false,
    amount: 0
  };

  const setOpen = (open) => {
    refs.root.hidden = !open;
    refs.root.classList.toggle("is-open", open);
    refs.root.classList.toggle("is-phone-opening", open);
    refs.root.closest("[data-dom-game-ui]")?.classList.toggle("is-wallet-open", open);
    if (open) {
      const user = getGoogleUser();
      updateGameState({
        objective: "Conferir carteira PubPaid",
        focus: "carteira real",
        walletFeedback: user?.email
          ? "Carteira aberta usando a base do PubPaid 1.0."
          : "Entre com Google para abrir a carteira real do PubPaid."
      });
      if (user?.email) {
        void syncPubpaidAccount();
      }
      window.setTimeout(() => refs.root.classList.remove("is-phone-opening"), 620);
    }
  };

  const setFeedback = (message) => {
    text(refs.feedback, message);
    updateGameState({ walletFeedback: message });
  };

  const resetDeposit = (message = "Gere o QR Code para abrir a etapa de confirmação.") => {
    local.txid = "";
    local.qrReady = false;
    local.amount = 0;
    html(refs.qr, `<p>${escapeHtml(message)}</p>`);
    if (refs.registerDeposit) refs.registerDeposit.disabled = true;
  };

  refs.openButtons.forEach((button) => {
    button.addEventListener("click", () => setOpen(true));
  });
  refs.closeButtons.forEach((button) => {
    button.addEventListener("click", () => setOpen(false));
  });
  refs.refreshButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setFeedback("Sincronizando carteira...");
      void syncPubpaidAccount();
    });
  });

  refs.depositAmount?.addEventListener("change", () => {
    resetDeposit("Valor alterado. Gere um novo QR antes de avisar o admin.");
  });

  refs.generateDeposit?.addEventListener("click", async () => {
    const user = getGoogleUser();
    if (!user?.email) {
      setFeedback("Entre com Google para gerar QR e usar a carteira real.");
      await window.CatalogoGoogleAuth?.promptSignIn?.();
      return;
    }

    const amount = getDepositAmount(refs.depositAmount);
    const depositorName = String(refs.depositorName?.value || "").trim();
    if (!amount) {
      setFeedback("Escolha um valor de depósito.");
      return;
    }
    if (depositorName.length < 3) {
      setFeedback("Informe o nome que aparece no comprovante Pix.");
      refs.depositorName?.focus?.();
      return;
    }

    local.txid = createPubpaidPaymentTxid("PUB");
    local.amount = amount;
    local.qrReady = false;
    html(refs.qr, "<p>Gerando QR Code na base do PubPaid 1.0...</p>");
    setFeedback("Gerando Pix protegido.");

    try {
      const payload = await generatePubpaidDepositPix({ amount, txid: local.txid });
      local.txid = payload.txid || local.txid;
      local.qrReady = true;
      html(refs.qr, `
        ${payload.qrSvg || "<p>QR indisponivel. Tente novamente.</p>"}
        <div class="ppg-wallet-pix-meta">
          <strong>Codigo Pix copia e cola</strong>
          <span>${escapeHtml(payload.copyCode || "Indisponivel")}</span>
        </div>
        <div class="ppg-wallet-pix-meta">
          <strong>Referencia</strong>
          <span>${escapeHtml(local.txid)}</span>
        </div>
      `);
      if (refs.registerDeposit) refs.registerDeposit.disabled = false;
      setFeedback(`QR criado para ${formatCoins(amount)} creditos. Depois do Pix, avise o admin.`);
    } catch (error) {
      resetDeposit(error?.message || "Nao foi possivel gerar QR agora.");
      setFeedback("Falha ao gerar Pix.");
    }
  });

  refs.registerDeposit?.addEventListener("click", async () => {
    const depositorName = String(refs.depositorName?.value || "").trim();
    if (!local.qrReady || !local.txid) {
      setFeedback("Gere o QR Code antes de registrar o deposito.");
      return;
    }
    if (depositorName.length < 3) {
      setFeedback("Informe o nome de quem fez o Pix.");
      refs.depositorName?.focus?.();
      return;
    }

    refs.registerDeposit.disabled = true;
    setFeedback("Enviando deposito para conferencia manual...");
    try {
      const payload = await registerPubpaidDeposit({
        amount: local.amount || getDepositAmount(refs.depositAmount),
        paymentTxid: local.txid,
        depositorName,
        sourcePage: "/pubpaid-v2.html"
      });
      html(refs.qr, `<p><strong>Deposito avisado.</strong></p><p>Referencia ${escapeHtml(local.txid)} enviada para o admin.</p>`);
      local.qrReady = false;
      setFeedback(payload.message || "Deposito registrado. Aguarde a conferencia manual.");
    } catch (error) {
      refs.registerDeposit.disabled = false;
      setFeedback(error?.message || "Falha ao registrar deposito.");
    }
  });

  refs.requestWithdrawal?.addEventListener("click", async () => {
    const amount = normalizePubpaidWalletAmount(refs.withdrawalAmount?.value, 0);
    if (amount <= 0) {
      setFeedback("Informe um valor valido para retirada.");
      return;
    }
    refs.requestWithdrawal.disabled = true;
    setFeedback("Enviando pedido de saque para o admin...");
    try {
      const payload = await requestPubpaidWithdrawal({
        amount,
        sourcePage: "/pubpaid-v2.html"
      });
      setFeedback(payload.message || "Saque solicitado. Valor travado ate revisao manual.");
    } catch (error) {
      setFeedback(error?.message || "Falha ao solicitar saque.");
    } finally {
      refs.requestWithdrawal.disabled = false;
    }
  });

  subscribeGameState((state) => {
    text(refs.balance, formatCoins(state.realBalance));
    text(refs.available, formatCoins(state.availableBalance));
    text(refs.lockedMatch, formatCoins(state.lockedMatchBalance));
    text(refs.lockedWithdrawal, formatCoins(state.lockedWithdrawalBalance));
    text(refs.pending, `${state.pendingDeposits || 0} deposito(s), ${state.pendingWithdrawals || 0} saque(s)`);
    if (state.walletFeedback) text(refs.feedback, state.walletFeedback);
    html(refs.deposits, buildHistory(state.recentDeposits, "Sem depositos recentes."));
    html(refs.withdrawals, buildHistory(state.recentWithdrawals, "Sem saques recentes."));
  });

  resetDeposit();
  window.pubpaidWalletOpen = () => setOpen(true);
  window.pubpaidWalletClose = () => setOpen(false);
}
