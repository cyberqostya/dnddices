const AudioContextClass = window.AudioContext || window.webkitAudioContext;

let audioCtx;
let isLifecycleInitialized = false;

function createAudioContext() {
  if (!AudioContextClass) return null;

  audioCtx = new AudioContextClass();
  return audioCtx;
}

export async function ensureAudioContext() {
  if (!audioCtx || audioCtx.state === "closed") {
    createAudioContext();
  }

  if (!audioCtx) return null;

  if (audioCtx.state !== "running" && document.visibilityState === "visible") {
    try {
      await audioCtx.resume();
    } catch (error) {
      console.warn("AudioContext resume failed", error);
    }
  }

  return audioCtx;
}

function resumeAudioContext() {
  ensureAudioContext();
}

export function initAudioLifecycle() {
  if (isLifecycleInitialized) return;
  isLifecycleInitialized = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      resumeAudioContext();
    }
  });

  window.addEventListener("pageshow", resumeAudioContext);
  window.addEventListener("focus", resumeAudioContext);

  ["pointerdown", "touchstart", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, resumeAudioContext, { passive: true });
  });
}

export async function loadAudioBuffer(soundLink) {
  const ctx = await ensureAudioContext();
  if (!ctx) return null;

  const response = await fetch(soundLink);
  const arrayBuffer = await response.arrayBuffer();

  return ctx.decodeAudioData(arrayBuffer.slice(0));
}

export async function playAudioBuffer(buffer) {
  if (!buffer) return;

  const ctx = await ensureAudioContext();
  if (!ctx) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
