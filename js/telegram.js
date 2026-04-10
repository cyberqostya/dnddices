const tg = window.Telegram.WebApp;

function initApp() {
  tg.ready();

  if (tg.platform !== "unknown") {
    document.body.classList.add("is-telegram");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

document.querySelector(".button._settings").addEventListener("click", () => {
  tg.HapticFeedback.impactOccurred("light");
});
