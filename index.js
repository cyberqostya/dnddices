import Dice from "./js/dice.js";
import SettingsButton from "./js/settingsButton.js";
import { triggerHaptic } from "./js/telegram.js";
import Total from "./js/total.js";

// ===== Переменные ===== //

let dices = []; // Классы кубиков
const banInterfaceNode = document.querySelector(".ban-interface"); // Блокировщик интерфейса против нажатий при выполнении вычислений
const total = new Total(); // Сумма всех бросков
const dicesContainerNode = document.querySelector(".dices"); // Контейнер, где крутятся кубики
const MAX_DICES_QUANTITY = 25;

const diceTowerNode = document.querySelector(".dice-tower"); // Кнопка сброса кубиков
const diceTowerTextNode = diceTowerNode.querySelector(".dice-tower__text"); // Текст кнопки сброса кубиков (добавленные кубики)

// ===== Вспомогательные функции ===== //

// Очистка результатов кубиков

function clearResults() {
  total.reset(); // Общий результат
  dices.forEach((dice) => dice.hideResult && dice.hideResult()); // Результат каждого кубика
}

// Сброс кубиков и результата (очистка всего)

function resetDices() {
  dices = [];
  render();
}

// ===== Настройки ===== //

window.settings = {
  // Карма
  karma: {
    counter: 0,
    button: new SettingsButton({
      isActive: true,
      title: "KARMA",
      callback: () => {
        settings.karma.counter = 0;
        clearResults();
      },
    }),
  },
  // Редактирование
  edit: {
    button: new SettingsButton({
      isActive: false,
      title: "EDIT",
      callback: () => {
        if (settings.edit.button.isActive) {
          window.addEventListener("click", deleteDice, true);

          dices.forEach((dice) => dice.switchRerollCounter(false));
        } else {
          window.removeEventListener("click", deleteDice, true);

          // После удаления нужно отфильтровать массив кубиков от пустышек
          const dicesAfterFilter = dices.filter((i) => i.edges);

          // Проверка произошло ли хоть одно удаление
          if (dices.length !== dicesAfterFilter.length) {
            dices = dicesAfterFilter;
            render();
          } else {
            dices.forEach((dice) => dice.switchRerollCounter(true));
          }
        }

        dices.forEach((dice) => dice.editModeSwitcher(settings.edit.button.isActive));
      },
    }),
  },
  // Переброс
  reroll: {
    button: new SettingsButton({
      isActive: false,
      title: "REROLL",
      callback: () => {
        if (settings.reroll.button.isActive) {
          window.addEventListener("click", reroll, true);
        } else {
          window.removeEventListener("click", reroll, true);
        }
      },
    }),
  },
};

// ===== Визуал кубиков ===== //

function renderDicesImages() {
  dicesContainerNode.classList[dices.length === 0 ? "add" : "remove"]("_empty"); // Пусто
  dicesContainerNode.classList[dices.length === 2 ? "add" : "remove"]("_xs"); // 2
  dicesContainerNode.classList[dices.length >= 3 && dices.length <= 4 ? "add" : "remove"]("_s"); // 3-4
  dicesContainerNode.classList[dices.length >= 5 && dices.length <= 6 ? "add" : "remove"]("_m"); // 5-6
  dicesContainerNode.classList[dices.length >= 7 && dices.length <= 9 ? "add" : "remove"]("_l"); // 7-9
  dicesContainerNode.classList[dices.length >= 10 && dices.length <= 12 ? "add" : "remove"]("_xl"); // 10-12
  dicesContainerNode.classList[dices.length >= 13 && dices.length <= 16 ? "add" : "remove"]("_xxl"); // 13-16
  dicesContainerNode.classList[dices.length >= 17 ? "add" : "remove"]("_xxxl"); // 17

  dicesContainerNode.innerHTML = "";
  dices.forEach((dice) => dicesContainerNode.insertAdjacentElement("beforeend", dice.node));

  // Только после добавления всех кубиков просчитываем высоту шрифта относительно их размера
  dices.forEach((dice) => dice.setResultFontSize && dice.setResultFontSize());
}

// ===== Бросок ===== //

dicesContainerNode.addEventListener("click", async () => {
  banInterfaceNode.classList.add("_disabled");

  clearResults();

  const results = [];
  for (let i = 0; i < dices.length; i++) {
    const dice = dices[i];
    dice.roll();
    dice.resetRerollCounter();
    results.push(dice.result);

    checkKarma(dice);

    await new Promise((res) => setTimeout(res, 100));
  }

  await new Promise((res) => setTimeout(res, dices[0].ANIMATION_DURATION));
  total.set(results);
  await new Promise((res) => setTimeout(res, 400));

  banInterfaceNode.classList.remove("_disabled");
});

// Карма
function checkKarma(dice) {
  if (settings.karma.button.isActive) {
    if (dice.result <= dice.MAX_FAILURE_ROLL) {
      settings.karma.counter += 1;
    } else if (dice.result >= dice.MIN_SUCCESS_ROLL) {
      settings.karma.counter -= 1;
    }
  } else {
    settings.karma.counter = 0;
  }
}

// ===== Удачный бросок ===== //

let luckCounter = 0;
const TAPS_TO_LUCK = 3;
const TAPS_RESET_TIME = 500;
let luckTimerId = 0;
const luckButton = document.querySelector(".total");
const luckMarker = document.querySelector(".total__placeholder");
luckButton.addEventListener("click", () => {
  if (luckMarker.classList.contains("_active")) {
    luckCounter++;

    // Таймаут после первого
    if (luckCounter === 1) {
      luckTimerId = setTimeout(() => {
        luckCounter = 0;
      }, TAPS_RESET_TIME);
    }

    if (luckCounter >= TAPS_TO_LUCK) {
      luckCounter = 0;
      settings.karma.counter = 7;
      clearTimeout(luckTimerId);

      luckMarker.animate([{ color: "#f0a020" }], {
        duration: 200,
        easing: "linear",
      });
    }
  }
});

// ===== Кнопка сброса кубиков ===== //

function renderDicesQuantityText() {
  diceTowerNode.classList[dices.length > 0 ? "remove" : "add"]("_empty"); // Отображение пустого

  // diceTowerTextNode.innerHTML = dices.map((i) => "d" + i.edges).join("&nbsp;+ "); // Просто текст
  const result = []; // [[count: edges]] // example: [[1: 6], [3: 4]] // means: [[1: d6], [3: d4]]
  for (const dice of dices) {
    // Для удаление по 1
    if (!dice.edges) continue;

    if (result.length === 0 || result.at(-1)[1] !== dice.edges) {
      result.push([1, dice.edges]);
    } else {
      result.at(-1)[0]++;
    }
  }

  diceTowerTextNode.innerHTML = result.map((i) => (i[0] === 1 ? "" : `<b>${i[0]}</b>`) + "d" + i[1]).join("&nbsp;+ ");
}

diceTowerNode.addEventListener("click", () => {
  triggerHaptic("light");
  resetDices();
});

// ===== Рендер ===== //

function render() {
  // Должно выполняться один раз при добавлении кубика // Оптимизировано
  if (total.dicesValues.length !== 0) clearResults();

  renderDicesImages();
  renderDicesQuantityText();
}

// ===== Кнопки добавления кубиков ===== //

const diceButtonsNodes = document.querySelectorAll(".button._dice");
diceButtonsNodes.forEach((diceButtonNode) => {
  diceButtonNode.addEventListener("click", function () {
    // Превышение максимально возможного количества кубиков
    if (dices.length === MAX_DICES_QUANTITY) return;

    triggerHaptic("light");
    const edges = Number(this.textContent.match(/\d+/g)[0]);
    dices.push(new Dice(edges));
    render();
  });
});

// ===== Кнопки настроек ===== //

Object.keys(settings).forEach((key) => {
  document.querySelector(".buttons-container._top").insertAdjacentElement("afterbegin", settings[key].button.node);
});

// ===== Удаление кубиков по одному ===== //
// Вставляем пустышки вместо удаленных кубиков, чтобы верстка не дергалась каждый раз

function deleteDice(e) {
  e.stopPropagation();

  const dice = e.target.closest(".dice");

  // Нажали не на кубик
  if (!dice || dice.children.length === 0) return settings.edit.button.toggle();

  const index = Array.from(dicesContainerNode.children).indexOf(dice);

  // dices = dices.filter((i, ind) => ind !== index); // Обычное удаление
  const tempDice = document.createElement("div"); // Удаление с пустышкой
  tempDice.classList.add("dice");
  const tempClass = { node: tempDice };
  dices = dices.map((i, ind) => (ind !== index ? i : tempClass));

  // Лаг на телефоне из-за оптимизации
  // При удалении класса кубика из массива классов переставала анимация тряски
  // Которая перерасчитывалась только при изменении ширины кубика в дом дереве
  // Решение - откл а затем вкл анимации вручную до и после добавления кубиков
  dices.forEach((i) => i.switchShake && i.switchShake(false));
  render();
  dices.forEach((i) => i.switchShake && i.switchShake(true));

  // Когда осталось пусто
  if (!dices.find((dice) => dice.edges)) {
    settings.edit.button.toggle();
  }
}

// ===== Reroll кубиков по одному ===== //
async function reroll(e) {
  e.stopPropagation();
  banInterfaceNode.classList.add("_disabled");

  const diceNode = e.target.closest(".dice");

  // Нажали не на кубик
  if (!diceNode || diceNode.children.length === 0) {
    settings.reroll.button.toggle();
  } else {
    const index = Array.from(dicesContainerNode.children).indexOf(diceNode);
    const dice = dices[index];

    // Нажали на кубик, который еще не бросили
    if (!dice.resultNode.classList.contains("_active")) {
      settings.reroll.button.toggle();
    } else {
      total.reset();

      dice.hideResult();
      dice.reroll();

      checkKarma(dice);

      await new Promise((res) => setTimeout(res, dice.ANIMATION_DURATION));
      dice.switchRerollCounter(true);
      total.set(dices.map((i) => i.result));
    }
  }

  banInterfaceNode.classList.remove("_disabled");
}
