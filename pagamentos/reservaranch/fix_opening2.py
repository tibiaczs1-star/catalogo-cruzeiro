with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the entire setupOpening + startExperience with a version that
# doesn't depend on YouTube loading
old_block = '''function setupOpening() {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + (progress < 72 ? 8 : 2));
      elements.openingProgress.style.width = `${progress}%`;
      if (progress === 100) {
        window.clearInterval(timer);
        elements.openingButton.disabled = false;
        elements.openingButton.textContent = "Reservar mesa";
      }
    }, 85);
    setTimeout(() => {
      if (elements.openingButton.disabled) {
        elements.openingButton.disabled = false;
        elements.openingButton.textContent = "Reservar mesa";
        elements.openingProgress.style.width = "100%";
      }
    }, 4000);
  }
  function startExperience() {
    try {
      const playerParams = new URLSearchParams({ autoplay: "1", enablejsapi: "1", loop: "1", mute: "0", origin: window.location.origin, playlist: YOUTUBE_VIDEO_ID, playsinline: "1", rel: "0" });
      elements.openingPlayer.addEventListener("load", () => { sendPlayerCommand("unMute"); sendPlayerCommand("setVolume", [70]); sendPlayerCommand("playVideo"); }, { once: true });
      elements.openingPlayer.src = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?${playerParams}`;
    } catch (err) {
      console.warn("YouTube embed failed, continuing without music:", err);
    }
    elements.opening.classList.add("is-complete");
    document.body.classList.remove("is-opening");
  }'''

new_block = '''function setupOpening() {
    elements.openingProgress.style.width = "100%";
    elements.openingButton.disabled = false;
    elements.openingButton.textContent = "Reservar mesa";
  }
  function startExperience() {
    elements.opening.classList.add("is-complete");
    document.body.classList.remove("is-opening");
  }'''

if old_block in js:
    js = js.replace(old_block, new_block)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('OK: opening simplified - no YouTube dependency')
else:
    print('ERROR: block not found')
    idx = js.find('function setupOpening')
    print(repr(js[idx:idx+600]))
