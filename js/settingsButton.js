// Класс который имеет состояние кнопки активности и перекрашивает ее по клику
// а затем выполняет побочные действия из переданного колбека

export default class SettingsButton {
  constructor({ isActive, title, callback }) {
    this.isActive = isActive;
    this.title = title;
    this.callback = callback;

    this.node = this.createNode();
    this.node.addEventListener("click", () => this.toggle());
  }

  toggle = () => {
    this.isActive = !this.isActive;
    this.render();

    this.callback();
  };

  render() {
    this.node.classList[this.isActive ? "add" : "remove"]("_active");
  }

  createNode() {
    const button = document.createElement("button");
    button.classList.add("button", "_settings");
    this.isActive && button.classList.add("_active");
    button.textContent = this.title;

    return button;
  }
}
