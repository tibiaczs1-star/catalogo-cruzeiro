(function () {
  "use strict";

  var root = document.documentElement;
  var loader = document.getElementById("cinematicLoader");
  if (!loader) return;
  window.__czsV8IntroControlled = true;

  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove("czs-intro-lock", "czs-daily-intro");
    root.classList.add("czs-intro-release", "czs-simple-loader");
    document.body.classList.remove("v8-intro-running");
    loader.classList.add("done");
    loader.hidden = true;
    loader.setAttribute("aria-hidden", "true");
    loader.style.pointerEvents = "none";
    window.setTimeout(function () {
      if (loader.parentNode) loader.remove();
    }, 220);
  }

  window.setTimeout(finish, 260);
  window.setTimeout(finish, 700);

  window.setTimeout(function () {
    root.classList.remove("czs-intro-lock", "czs-daily-intro");
    document.body.classList.remove("v8-intro-running");
  }, 0);
}());
