const tg = window.Telegram.WebApp;

if (tg.platform !== "unknown") {
  document.body.classList.add("is-telegram");
}
