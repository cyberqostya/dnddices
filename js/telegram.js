const tg = window.Telegram?.WebApp;

function initApp() {
  if (tg) {
    tg.ready();
  }

  if (tg.platform !== "unknown") {
    document.body.classList.add("is-telegram");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

setTimeout(() => {
  document.querySelector(".button._settings").addEventListener("click", () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("success");
    }
  });
}, 5000);
