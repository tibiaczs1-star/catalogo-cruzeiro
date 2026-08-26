(function () {
  "use strict";

  const EPISODE_CUES = ["gate", "boots", "saloon", "fire"];
  const FRAME_INTERVAL_MS = 285;
  const SCENE_TRANSITION_MS = 1900;
  const SCENE_CLASSES = ["is-playing", "is-shot-wide", "is-comic", "is-copy-reveal", "is-ready", "is-advancing", "is-frame-complete"];
  const sequenceTimers = new Set();
  let active = 0;
  let transitioning = false;

  function elements() {
    return {
      player: document.querySelector("#episode-player"),
      episodes: [...document.querySelectorAll("[data-episode]")],
      count: document.querySelector("#episode-count"),
      transition: document.querySelector(".comic-transition"),
    };
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clearSequence() {
    sequenceTimers.forEach((timer) => window.clearTimeout(timer));
    sequenceTimers.clear();
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function schedule(callback, ms) {
    const timer = window.setTimeout(() => {
      sequenceTimers.delete(timer);
      callback();
    }, ms);
    sequenceTimers.add(timer);
  }

  function updateButtons(disabled) {
    elements().episodes.forEach((episode) => {
      const button = episode.querySelector("[data-next-episode], [data-finish-episodes]");
      if (button) button.disabled = disabled;
    });
  }

  function resetFrames(episode) {
    const frames = [...episode.querySelectorAll(".film-keyframe")];
    frames.forEach((frame, index) => {
      frame.classList.toggle("is-frame-active", index === 0);
      frame.classList.remove("is-frame-leaving");
    });
    episode.classList.remove("is-advancing", "is-frame-complete");
  }

  async function playFrameSequence(episode) {
    const frames = [...episode.querySelectorAll(".film-keyframe")];
    if (frames.length < 2) return;

    updateButtons(true);
    episode.classList.add("is-advancing", "is-comic");
    const shot = episode.querySelector(".cinema-shot-wide");
    if (!reducedMotion() && typeof shot?.animate === "function") {
      shot.animate(
        [
          { transform: "translate3d(-1.5%,1%,-35px) scale(1.07) rotateY(-1deg)" },
          { transform: "translate3d(.8%,-.5%,0) scale(1.015) rotateY(.5deg)" },
        ],
        { duration: Math.max(2600, frames.length * FRAME_INTERVAL_MS), easing: "cubic-bezier(.18,.72,.16,1)", fill: "both" }
      );
    }

    await delay(reducedMotion() ? 10 : 90);
    for (let index = 1; index < frames.length; index += 1) {
      const previous = frames[index - 1];
      const current = frames[index];
      previous.classList.add("is-frame-leaving");
      current.classList.add("is-frame-active");
      await delay(reducedMotion() ? 8 : FRAME_INTERVAL_MS);
      previous.classList.remove("is-frame-active", "is-frame-leaving");
    }
    episode.classList.add("is-frame-complete");
    await delay(reducedMotion() ? 10 : 420);
  }

  function runScene(episode) {
    clearSequence();
    SCENE_CLASSES.forEach((className) => episode.classList.remove(className));
    resetFrames(episode);
    void episode.offsetWidth;

    const scene = episode.dataset.scene || EPISODE_CUES[active];
    const narration = episode.dataset.narration || "";
    const instant = reducedMotion();
    episode.classList.add("is-playing", "is-shot-wide");
    updateButtons(true);

    const reveal = (className, time) => schedule(() => episode.classList.add(className), instant ? 20 : time);
    reveal("is-copy-reveal", 800);
    reveal("is-ready", 1600);
    schedule(() => updateButtons(false), instant ? 40 : 1600);

    window.ArizonaSoundscapeInstance?.playScene?.(scene);
    schedule(() => window.ArizonaSoundscapeInstance?.playSceneNarration(scene, narration), instant ? 80 : 950);
  }

  function activate(index) {
    const { player, episodes, count } = elements();
    if (!episodes.length) return;
    active = Math.max(0, Math.min(index, episodes.length - 1));
    episodes.forEach((episode, episodeIndex) => {
      const isActive = episodeIndex === active;
      episode.classList.toggle("is-active", isActive);
      if (!isActive) SCENE_CLASSES.forEach((className) => episode.classList.remove(className));
    });
    if (count) count.textContent = `${String(active + 1).padStart(2, "0")} / ${String(episodes.length).padStart(2, "0")}`;
    player?.style.setProperty("--episode", active);
    runScene(episodes[active]);
  }

  async function transitionTo(index) {
    if (transitioning) return;
    const { player, episodes, transition } = elements();
    const current = episodes[active];
    if (!current || !episodes[index]) return;
    transitioning = true;
    updateButtons(true);
    transition?.classList.add("is-sweeping");

    if (!reducedMotion() && typeof current.animate === "function") {
      current.animate(
        [
          { transform: "translate3d(0,0,0) rotateY(0deg) scale(1)", clipPath: "inset(0 0 0 0)", opacity: 1 },
          { transform: "translate3d(-8vw,0,-180px) rotateY(7deg) scale(.94)", clipPath: "inset(3% 14% 3% 0)", opacity: 0.22 },
        ],
        { duration: SCENE_TRANSITION_MS, easing: "cubic-bezier(.7,0,.2,1)", fill: "forwards" }
      );
    }

    player?.classList.add("is-turning");
    await delay(reducedMotion() ? 30 : 950);
    activate(index);
    await delay(reducedMotion() ? 30 : 950);
    transition?.classList.remove("is-sweeping");
    player?.classList.remove("is-turning");
    transitioning = false;
  }

  async function advanceTo(index) {
    if (transitioning) return;
    const current = elements().episodes[active];
    if (!current) return;
    transitioning = true;
    await playFrameSequence(current);
    transitioning = false;
    await transitionTo(index);
  }

  function show(index) {
    activate(index);
  }

  function begin() {
    document.body.classList.add("is-story");
    const { player } = elements();
    if (player) {
      player.hidden = false;
      window.requestAnimationFrame(() => player.classList.add("is-visible"));
    }
    activate(0);
  }

  function finish() {
    clearSequence();
    const { player } = elements();
    player?.classList.add("is-leaving");
    window.setTimeout(() => {
      player?.setAttribute("hidden", "");
      player?.classList.remove("is-visible", "is-leaving", "is-turning");
      document.body.classList.remove("is-story");
      document.body.classList.add("is-purchase");
      const shell = document.querySelector(".site-shell");
      shell?.removeAttribute("aria-hidden");
      document.querySelector("#mapa-de-mesas")?.scrollIntoView({ behavior: "smooth" });
      window.ArizonaSoundscapeInstance?.cue("coin");
    }, reducedMotion() ? 40 : 700);
  }

  async function transitionToPurchase() {
    if (transitioning) return;
    const { transition } = elements();
    transitioning = true;
    updateButtons(true);
    transition?.classList.add("is-sweeping");
    await delay(reducedMotion() ? 30 : 950);
    finish();
    await delay(reducedMotion() ? 50 : 1150);
    transition?.classList.remove("is-sweeping");
    transitioning = false;
  }

  async function advanceToPurchase() {
    if (transitioning) return;
    const current = elements().episodes[active];
    if (!current) return;
    transitioning = true;
    await playFrameSequence(current);
    transitioning = false;
    await transitionToPurchase();
  }

  function completePurchase() {
    document.body.classList.remove("is-purchase", "is-story");
    document.body.classList.add("is-landing");
    const shell = document.querySelector(".site-shell");
    shell?.removeAttribute("aria-hidden");
    window.setTimeout(() => document.querySelector("#inicio")?.scrollIntoView({ behavior: "smooth" }), 220);
  }

  function applyParallax(event) {
    const { player } = elements();
    if (!player || player.hidden) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    player.style.setProperty("--parallax-x", `${x * 15}px`);
    player.style.setProperty("--parallax-y", `${y * 9}px`);
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-next-episode]")) advanceTo(active + 1);
    if (event.target.closest("[data-finish-episodes]")) advanceToPurchase();
  });
  window.addEventListener("pointermove", applyParallax, { passive: true });
  window.ArizonaEpisodes = { begin, finish, show, transitionTo, completePurchase };
})();
