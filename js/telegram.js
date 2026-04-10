const tg = window.Telegram.WebApp;

function initApp() {
  if (tg.initData !== "") {
    document.body.classList.add("is-telegram");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

tg.HapticFeedback.impactOccurred("light");
