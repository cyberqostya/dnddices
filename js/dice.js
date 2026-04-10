import getMathSign from "./helpers.js";
import { initAudioLifecycle, loadAudioBuffer, playAudioBuffer } from "./audio.js";
import { triggerHaptic } from "./telegram.js";

export default class Dice {
  ANIMATION_DURATION = 600;
  SUCCESS_MODIFIER = 0.75;
  FAILURE_MODIFIER = 0.25;
  ROLL_SOUNDS = ["./sounds/roll1.mp3", "./sounds/roll2.mp3", "./sounds/roll3.mp3", "./sounds/roll4.mp3"];
  COIN_SOUND = "./sounds/coin.mp3";
  audioReady;

  constructor(edges) {
    this.edges = edges;
    this.node;
    this.resultNode;
    this.crossNode;
    this.rerollCounterNode;
    this.rerollCounter = 0;
    this.MIN_SUCCESS_ROLL = Math.ceil(this.SUCCESS_MODIFIER * edges);
    this.MAX_FAILURE_ROLL = Math.ceil(this.FAILURE_MODIFIER * edges);

    this.buffer;

    this.shakeAnimationID;

    this.result = 0;

    this.createNode();
    this.audioReady = this.initSound();
  }

  createNode() {
    const div = document.createElement("div");
    div.classList.add("dice");
    if (this.edges === 4) div.style.transformOrigin = "center 55%";

    const img = document.createElement("img");
    img.setAttribute("alt", "d" + this.edges);
    img.setAttribute("src", "./images/d" + this.edges + ".svg");

    const result = document.createElement("span");
    result.classList.add("dice__result");
    this.resultNode = result;

    const cross = document.createElement("button");
    cross.classList.add("cross", "_dark", "dice__cross");
    this.crossNode = cross;

    const rerollCounter = document.createElement("div");
    rerollCounter.classList.add("reroll-counter");
    this.rerollCounterNode = rerollCounter;

    div.appendChild(img);
    div.appendChild(result);
    div.appendChild(cross);
    div.appendChild(rerollCounter);
    this.node = div;
  }

  _getRandomEdge = () => 1 + Math.floor(Math.random() * this.edges);
  _getKarmaSuccessEdge = () => this.MIN_SUCCESS_ROLL + Math.round(Math.random() * (this.edges - this.MIN_SUCCESS_ROLL));
  _getKarmaFailureEdge = () => 1 + Math.round(Math.random() * (this.edges - this.MIN_SUCCESS_ROLL));
  roll = () => {
    const karmaCounter = settings.karma.counter;
    // console.log("бросок с текущей кармой = ", karmaCounter);

    // Обычный бросок
    if (karmaCounter === 0 || this.FAILURE_MODIFIER + Math.abs(karmaCounter / 10) < Math.random()) {
      // console.log("обычный бросок");
      this.result = this._getRandomEdge();
    }

    // Кармический бросок
    else {
      if (karmaCounter > 0) {
        // console.log("СЫГРАЛА ПЛЮС КАРМА");
        this.result = this._getKarmaSuccessEdge();
      } else {
        // console.log("СЫГРАЛА МИНУС КАРМА");
        this.result = this._getKarmaFailureEdge();
      }
    }

    triggerHaptic("heavy");
    this.playSound();
    this.animate();
    setTimeout(this.showResult, this.ANIMATION_DURATION * 0.8);

    // console.log("результат", result);
    // console.log("-----------------------------------");
  };

  // ===== Анимации текста результата =====

  showResult = () => {
    this.resultNode.textContent = this.result;
    this.resultNode.classList.add("_active");
    if (this.result === this.edges) this.resultNode.classList.add("_luck");
    if (this.result === 1) this.resultNode.classList.add("_unluck");
    this.node.classList.add("_blured");
  };
  hideResult() {
    this.resultNode.classList.remove("_active");
    this.resultNode.classList.remove("_luck");
    this.resultNode.classList.remove("_unluck");
    this.node.classList.remove("_blured");

    this.switchRerollCounter(false);
  }
  setResultFontSize() {
    this.node.style.fontSize = Math.round(this.node.clientHeight * 0.7) + "px";
  }

  // ===== Анимации броска =====

  // 1
  animationRoll() {
    this.node.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], {
      duration: this.ANIMATION_DURATION,
      easing: "ease-out",
    });
  }
  // 2
  async animationFlip() {
    this.node.animate([{ translate: "0 0" }, { translate: "0 15%" }, { translate: "0 -15%" }], {
      duration: this.ANIMATION_DURATION * 0.5,
      easing: "ease",
      fill: "forwards",
    });
    await new Promise((res) => setTimeout(res, this.ANIMATION_DURATION * 0.3));
    this.node.animate([{ transform: "rotateX(0)" }, { transform: "rotateX(-360deg)" }], {
      duration: this.ANIMATION_DURATION * 0.7,
      easing: "ease",
      fill: "forwards",
    });
    await new Promise((res) => setTimeout(res, this.ANIMATION_DURATION * 0.4));
    this.node.animate([{ translate: "0 -15%" }, { translate: "0 0" }], {
      duration: this.ANIMATION_DURATION * 0.5,
      easing: "ease",
      fill: "forwards",
    });
  }
  // главная анимация
  animate() {
    if (this.edges === 2) {
      this.animationFlip();
    } else {
      this.animationRoll();
    }
  }

  // ===== Звук броска =====

  async initSound() {
    // Создание контекста при первом создании кубика
    // Чтобы избежать ошибки, пока юзер не совершил событие
    // А также контекст один на все приложение для оптимальной работы
    initAudioLifecycle();

    // Отдельный звук для монетки
    let soundLink;
    if (this.edges === 2) {
      soundLink = this.COIN_SOUND;
    } else {
      soundLink = this.ROLL_SOUNDS[Math.floor(Math.random() * this.ROLL_SOUNDS.length)];
    }

    this.buffer = await loadAudioBuffer(soundLink);
  }
  async playSound() {
    await this.audioReady;
    await playAudioBuffer(this.buffer);
  }

  // ===== Редактирование =====

  editModeSwitcher(mode) {
    this.switchCross(mode);
    this.switchShake(mode);
  }

  switchCross(mode) {
    this.crossNode.classList[mode ? "add" : "remove"]("_active");
  }

  // ===== Тряска при удалении =====

  sign = getMathSign(); // Постоянный знак для поддержания плюса в начале и минусы в конце (и наоборот)
  MAX_DELTA_SHAKE_POSITION = 0.7;
  START_SHAKE_POSITION = 1;
  END_SHAKE_POSITION = -1.5;
  RANDOM_DELTA_SHAKE_START = Math.random() * this.MAX_DELTA_SHAKE_POSITION * getMathSign();
  RANDOM_DELTA_SHAKE_END = Math.random() * this.MAX_DELTA_SHAKE_POSITION * getMathSign();
  startShakePositivePosition = this.START_SHAKE_POSITION * this.sign + this.RANDOM_DELTA_SHAKE_START;
  endShakeNegativePosition = this.END_SHAKE_POSITION * this.sign + this.RANDOM_DELTA_SHAKE_END;
  RANDOM_SHAKE_DURATION = 150 + Math.round(Math.random() * 100);

  switchShake = (mode) => {
    if (mode) {
      this.shakeAnimationID = this.node.animate(
        [
          { transform: `translate(0, 0) rotate(0deg)` },
          { transform: `translate(${this.endShakeNegativePosition}px, 0) rotate(${this.startShakePositivePosition}deg)` },
          { transform: `translate(0, ${this.startShakePositivePosition}px) rotate(${this.endShakeNegativePosition}deg)` },
          { transform: `translate(0, 0) rotate(0deg)` },
        ],
        {
          duration: this.RANDOM_SHAKE_DURATION,
          iterations: Infinity,
          easing: "linear",
        },
      );
    } else {
      this.shakeAnimationID.cancel();
    }
  };

  // ===== Перебросы =====

  reroll() {
    this.roll();
    this.rerollCounter++;
    this.rerollCounterNode.textContent = this.rerollCounter;
  }

  switchRerollCounter(mode) {
    this.rerollCounterNode.classList[mode && this.rerollCounter ? "add" : "remove"]("_active");
  }
  resetRerollCounter() {
    this.rerollCounter = 0;
  }
}
