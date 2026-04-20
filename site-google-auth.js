(function () {
  const state = {
    enabled: false,
    clientId: "",
    user: null,
    ready: false,
    buttonRendered: false,
    scriptPromise: null
  };
  const FORCE_REAUTH_KEY = "catalogo_google_force_reauth_v1";

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || payload.message || "Falha na autenticacao.");
    }
    return payload;
  }

  function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (state.scriptPromise) return state.scriptPromise;
    state.scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Nao foi possivel carregar o login Google."));
      document.head.appendChild(script);
    });
    return state.scriptPromise;
  }

  function emitAuthChange() {
    window.dispatchEvent(
      new CustomEvent("catalogo:google-auth", {
        detail: {
          enabled: state.enabled,
          signedIn: Boolean(state.user),
          user: state.user
        }
      })
    );
  }

  function setText(node, value) {
    if (node) node.textContent = String(value || "");
  }

  function shouldForceReauth() {
    try {
      return window.sessionStorage.getItem(FORCE_REAUTH_KEY) === "1";
    } catch (_error) {
      return false;
    }
  }

  function markForceReauth(enabled) {
    try {
      if (enabled) {
        window.sessionStorage.setItem(FORCE_REAUTH_KEY, "1");
      } else {
        window.sessionStorage.removeItem(FORCE_REAUTH_KEY);
      }
    } catch (_error) {
      // ignore storage failures
    }
  }

  function syncDom() {
    const signedIn = Boolean(state.user);
    document.documentElement.classList.toggle("has-google-auth", signedIn);
    $all("[data-google-auth-card]").forEach((card) => {
      card.classList.toggle("is-signed", signedIn);
      card.classList.toggle("is-disabled", !state.enabled);
    });
    $all("[data-google-auth-status]").forEach((node) => {
      setText(
        node,
        !state.enabled
          ? "Login Google precisa ser configurado no Render"
          : signedIn
            ? `Conectado como ${state.user.name || state.user.email}`
            : "Entre com Google para continuar"
      );
    });
    $all("[data-google-auth-email]").forEach((node) => {
      setText(
        node,
        signedIn
          ? state.user.email
          : state.enabled
            ? "Cadastros, newsletter, fundadores e PubPaid usam a mesma identidade."
            : "Configure GOOGLE_AUTH_CLIENT_ID e SITE_AUTH_SESSION_SECRET para liberar o acesso."
      );
    });
    $all("[data-google-auth-button]").forEach((node) => {
      node.hidden = signedIn || !state.enabled;
    });
    $all("[data-google-auth-logout]").forEach((node) => {
      node.hidden = !signedIn;
    });
  }

  async function renderGoogleButtons() {
    if (!state.enabled || state.user || state.buttonRendered) return;
    await loadGoogleScript();
    window.google.accounts.id.initialize({
      client_id: state.clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    $all("[data-google-auth-button]").forEach((container) => {
      container.innerHTML = "";
      const width = Math.max(220, Math.min(340, container.clientWidth || 280));
      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        shape: "pill",
        text: "signin_with",
        logo_alignment: "left",
        width
      });
    });
    state.buttonRendered = true;
  }

  async function promptSignIn() {
    if (!state.enabled || state.user) return false;
    await renderGoogleButtons().catch(() => {});
    if (!window.google?.accounts?.id?.prompt) return false;
    if (shouldForceReauth() && window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }
    window.google.accounts.id.prompt();
    return true;
  }

  async function handleCredential(response) {
    try {
      const payload = await requestJson("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: response?.credential || "" })
      });
      state.user = payload.user || null;
      markForceReauth(false);
      state.buttonRendered = false;
      syncDom();
      emitAuthChange();
      await renderGoogleButtons();
    } catch (error) {
      $all("[data-google-auth-email]").forEach((node) => {
        setText(node, String(error?.message || "Nao foi possivel validar o Google agora."));
      });
      emitAuthChange();
    }
  }

  async function logout() {
    const currentEmail = String(state.user?.email || "").trim();
    try {
      await requestJson("/api/auth/logout", { method: "POST", body: "{}" });
    } catch (_error) {
      // A interface tambem limpa o estado local caso o pedido falhe.
    }
    markForceReauth(true);
    if (window.google?.accounts?.id?.cancel) {
      window.google.accounts.id.cancel();
    }
    if (window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }
    if (currentEmail && window.google?.accounts?.id?.revoke) {
      try {
        window.google.accounts.id.revoke(currentEmail, () => {});
      } catch (_error) {
        // best effort only
      }
    }
    state.user = null;
    state.buttonRendered = false;
    syncDom();
    emitAuthChange();
    await renderGoogleButtons().catch(() => {});
  }

  async function refresh() {
    try {
      const config = await requestJson("/api/auth/config", { method: "GET" });
      state.enabled = Boolean(config.enabled && config.clientId);
      state.clientId = config.clientId || "";
      const session = await requestJson("/api/auth/session", { method: "GET" });
      state.user = session.user || null;
      state.ready = true;
      syncDom();
      emitAuthChange();
      await renderGoogleButtons();
    } catch (_error) {
      state.enabled = false;
      state.user = null;
      state.ready = true;
      syncDom();
      emitAuthChange();
    }
  }

  document.addEventListener("click", (event) => {
    const logoutButton = event.target.closest("[data-google-auth-logout]");
    if (!logoutButton) return;
    event.preventDefault();
    void logout();
  });

  window.CatalogoGoogleAuth = {
    getUser: () => state.user,
    isReady: () => state.ready,
    isEnabled: () => state.enabled,
    isSignedIn: () => Boolean(state.user),
    promptSignIn,
    refresh,
    logout
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void refresh(), { once: true });
  } else {
    void refresh();
  }
})();
