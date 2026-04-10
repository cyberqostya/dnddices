// Класс который имеет состояние кнопки активности и перекрашивает ее по клику
// а затем выполняет побочные действия из переданного колбека

import { triggerHaptic } from "./telegram.js";
import { initAudioLifecycle, loadAudioBuffer, playAudioBuffer } from "./audio.js";

export default class SettingsButton {
  audioReady;

  constructor({ node, isActive, callback, soundOn, soundOff }) {
    this.node = node;
    this.isActive = isActive;
    this.callback = callback;
    this.soundOn = soundOn;
    this.soundOff = soundOff;
    this.soundOnBuffer = null;
    this.soundOffBuffer = null;

    this.render();
    this.node.addEventListener("click", () => this.toggle());
    this.audioReady = this.initSound();
  }

  // ===== Звук кнопки =====
  async initSound() {
    initAudioLifecycle();
    if (this.soundOn) this.soundOnBuffer = await loadAudioBuffer(this.soundOn);
    if (this.soundOff) this.soundOffBuffer = await loadAudioBuffer(this.soundOff);
  }
  async playSound() {
    await this.audioReady;
    const buffer = this.isActive ? this.soundOnBuffer : this.soundOffBuffer;
    await playAudioBuffer(buffer);
  }

  toggle = () => {
    this.isActive = !this.isActive;
    this.render();
    triggerHaptic("light");
    this.playSound();

    this.callback();
  };

  render() {
    this.node.classList[this.isActive ? "add" : "remove"]("_active");
  }
}
