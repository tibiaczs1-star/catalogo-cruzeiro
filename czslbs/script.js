"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector("[data-header]");

window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
}, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

const rotatingIdea = document.querySelector("[data-rotating-idea]");
const rotatingIdeas = ["INFORMAÇÃO", "COMÉRCIO", "SERVIÇOS", "CULTURA", "OPORTUNIDADES"];

if (rotatingIdea && !reducedMotion) {
  let rotatingIdeaIndex = 0;

  window.setInterval(() => {
    rotatingIdea.classList.add("is-changing");

    window.setTimeout(() => {
      rotatingIdeaIndex = (rotatingIdeaIndex + 1) % rotatingIdeas.length;
      rotatingIdea.textContent = rotatingIdeas[rotatingIdeaIndex];
      rotatingIdea.classList.remove("is-changing");
    }, 180);
  }, 2400);
}

if (!reducedMotion) {
  const canvas = document.querySelector("#constellation");
  const context = canvas?.getContext("2d");
  let dots = [];
  let width = 0;
  let height = 0;

  const resize = () => {
    width = canvas.width = window.innerWidth * devicePixelRatio;
    height = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    const count = Math.min(56, Math.max(24, Math.floor(window.innerWidth / 27)));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: Math.random() * 1.2 + 0.5
    }));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    for (const dot of dots) {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < 0 || dot.x > innerWidth) dot.vx *= -1;
      if (dot.y < 0 || dot.y > innerHeight) dot.vy *= -1;
    }
    for (let i = 0; i < dots.length; i += 1) {
      const dot = dots[i];
      context.beginPath();
      context.fillStyle = "rgba(76, 192, 255, .44)";
      context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      context.fill();
      for (let j = i + 1; j < dots.length; j += 1) {
        const other = dots[j];
        const distance = Math.hypot(dot.x - other.x, dot.y - other.y);
        if (distance > 130) continue;
        context.beginPath();
        context.strokeStyle = `rgba(35, 163, 255, ${0.13 * (1 - distance / 130)})`;
        context.lineWidth = 0.6;
        context.moveTo(dot.x, dot.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    }
    requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener("resize", resize, { passive: true });
}
