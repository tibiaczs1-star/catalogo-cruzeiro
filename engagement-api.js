"use strict";

(function () {
  function apiBase() {
    if (typeof window.CATALOGO_API_BASE === "string" && window.CATALOGO_API_BASE) {
      return window.CATALOGO_API_BASE.replace(/\/$/, "");
    }
    if (location.protocol === "file:") return "http://localhost:8787";
    return location.origin;
  }

  const API = apiBase();

  function safe(value, max = 250) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  async function post(endpoint, payload) {
    const response = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.json();
  }

  function initSubscriptionForms() {
    const forms = Array.from(
      document.querySelectorAll(
        "[data-subscription-form], #subscriptionForm, #memberForm, form[data-role='subscription']"
      )
    );
    if (!forms.length) return;

    forms.forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const emailField =
          form.querySelector("input[type='email']") ||
          form.querySelector("input[name='email']");
        const nameField = form.querySelector("input[name='name']");
        const whatsappField = form.querySelector("input[name='whatsapp']");

        const email = safe(emailField?.value, 160);
        if (!email) return;

        const payload = {
          name: safe(nameField?.value, 120),
          email,
          whatsapp: safe(whatsappField?.value, 40),
          consent: true,
          consentVersion: "1.0",
          sourcePage: `${location.pathname}${location.search}`
        };

        const result = await post("/api/subscriptions", payload).catch(() => null);
        const feedback = form.querySelector("[data-form-feedback]");
        if (!feedback) return;

        feedback.textContent = result?.ok
          ? "Assinatura recebida com sucesso."
          : "Não foi possível enviar agora.";
      });
    });
  }

  function initCommentForms() {
    const forms = Array.from(
      document.querySelectorAll(
        "[data-comment-form], #commentForm, form[data-role='comment']"
      )
    );
    if (!forms.length) return;

    forms.forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const articleId =
          safe(form.getAttribute("data-article-id"), 120) ||
          safe(new URLSearchParams(location.search).get("id"), 120) ||
          safe(location.pathname, 120);
        const messageField =
          form.querySelector("textarea[name='comment']") ||
          form.querySelector("textarea");
        const authorField = form.querySelector("input[name='author']");
        const message = safe(messageField?.value, 1000);
        if (message.length < 6) return;

        const payload = {
          articleId,
          author: safe(authorField?.value || "Leitor(a)", 80),
          message
        };

        const result = await post("/api/comments", payload).catch(() => null);
        const feedback = form.querySelector("[data-form-feedback]");
        if (feedback) {
          feedback.textContent = result?.ok
            ? "Comentário publicado."
            : "Falha ao enviar comentário.";
        }
        if (result?.ok && messageField) {
          messageField.value = "";
        }
      });
    });
  }

  function init() {
    initSubscriptionForms();
    initCommentForms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
