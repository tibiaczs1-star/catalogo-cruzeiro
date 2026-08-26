export const INTRO_SESSION_KEY = "angel-midia:intro:beta-1.0";

function reducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function introWasSeen() {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) === "seen";
  } catch {
    return false;
  }
}

function rememberIntro() {
  try {
    sessionStorage.setItem(INTRO_SESSION_KEY, "seen");
  } catch {}
}

export function mountSystemIntro(root, { duration = 2600, exitDuration = 380 } = {}) {
  const intro = root.querySelector("[data-system-intro]");
  if (!intro) return () => {};
  if (introWasSeen() || reducedMotion()) {
    intro.remove();
    return () => {};
  }

  let finished = false;
  let removalTimer;
  let mainTimer;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(mainTimer);
    rememberIntro();
    intro.classList.add("is-leaving");
    intro.setAttribute("aria-hidden", "true");
    removalTimer = setTimeout(() => {
      intro.remove();
      root.querySelector('[name="identifier"]')?.focus({ preventScroll: true });
    }, exitDuration);
  };

  intro.querySelector("[data-intro-skip]")?.addEventListener("click", finish, { once: true });
  mainTimer = setTimeout(finish, duration);
  return () => {
    clearTimeout(mainTimer);
    clearTimeout(removalTimer);
  };
}
