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

async function resumeExistingAudioContext() {
  if (!audioCtx || audioCtx.state === "closed") return null;

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
  void resumeExistingAudioContext();
}

function activateAudioContext() {
  void ensureAudioContext();
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
    window.addEventListener(eventName, activateAudioContext, { passive: true });
  });
}

export async function loadAudioAsset(soundLink) {
  const response = await fetch(soundLink);
  return response.arrayBuffer();
}

async function decodeAudioAsset(asset, ctx) {
  if (!asset) return null;
  if (asset.decodedBuffer) return asset.decodedBuffer;

  asset.decodedBuffer = await ctx.decodeAudioData(asset.arrayBuffer.slice(0));
  return asset.decodedBuffer;
}

export async function playAudioAsset(asset) {
  if (!asset) return;

  const ctx = await ensureAudioContext();
  if (!ctx) return;

  const buffer = await decodeAudioAsset(asset, ctx);
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
