(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function duplicateTape() {
    const tape = document.querySelector(".proof-tape div");
    if (!tape || tape.dataset.ready) return;
    tape.innerHTML += tape.innerHTML;
    tape.dataset.ready = "true";
  }

  function revealSections() {
    const items = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  function animateCounters() {
    const counters = Array.from(document.querySelectorAll("[data-count-to]"));
    if (!counters.length) return;
    const run = (element) => {
      const target = Number(element.dataset.countTo || 0);
      if (!Number.isFinite(target) || target <= 0) return;
      if (reducedMotion) {
        element.textContent = String(target);
        return;
      }
      const startedAt = performance.now();
      const duration = 1250;
      const frame = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };
    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    counters.forEach((counter) => observer.observe(counter));
  }

  function typeWriter() {
    const target = document.querySelector("[data-typewriter]");
    if (!target) return;
    const text = target.getAttribute("data-typewriter") || "";
    if (reducedMotion) {
      target.textContent = text;
      return;
    }
    target.textContent = "";
    let index = 0;
    const tick = () => {
      target.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) window.setTimeout(tick, index < 8 ? 90 : 34);
    };
    window.setTimeout(tick, 550);
  }

  function tiltCards() {
    const cards = Array.from(document.querySelectorAll("[data-tilt]"));
    if (!cards.length || reducedMotion) return;
    cards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", x.toFixed(3));
        card.style.setProperty("--tilt-y", y.toFixed(3));
        card.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
        card.style.transform = "";
      });
    });
  }

  function cinematicPointer() {
    if (reducedMotion) return;
    let raf = 0;
    const update = (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = `${((event.clientX / window.innerWidth) * 100).toFixed(2)}%`;
        const y = `${((event.clientY / window.innerHeight) * 100).toFixed(2)}%`;
        document.body.style.setProperty("--mx", x);
        document.body.style.setProperty("--my", y);
      });
    };
    window.addEventListener("pointermove", update, { passive: true });

    const depthItems = Array.from(document.querySelectorAll("[data-depth]"));
    if (!depthItems.length) return;
    window.addEventListener("pointermove", (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      depthItems.forEach((item) => {
        const depth = Number(item.dataset.depth || 0);
        item.style.transform = `translate3d(${(-x * depth * 900).toFixed(2)}px, ${(-y * depth * 520).toFixed(2)}px, 0)`;
      });
    }, { passive: true });
  }

  function settleHashScroll() {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    window.setTimeout(() => {
      target.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
    }, 450);
  }

  duplicateTape();
  revealSections();
  animateCounters();
  typeWriter();
  tiltCards();
  cinematicPointer();
  settleHashScroll();
})();
