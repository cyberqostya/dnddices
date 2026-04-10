const tg = window.Telegram?.WebApp;

export function isTelegramWebApp() {
  return Boolean(tg && tg.platform !== "unknown");
}

export function triggerHaptic(type = "light") {
  if (!isTelegramWebApp() || !tg?.HapticFeedback) return;

  tg.HapticFeedback.impactOccurred(type);
}

function initApp() {
  if (!tg) return;

  tg.ready();

  if (isTelegramWebApp()) {
    document.body.classList.add("is-telegram");
    tg.disableVerticalSwipes();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
