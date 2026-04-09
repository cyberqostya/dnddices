export default class Total {
  constructor() {
    this.node = document.querySelector(".total");
    this.textNode = document.querySelector(".total__text");
    this.placeholderNode = document.querySelector(".total__placeholder");

    this.dicesValues = [];
    this.isRolling = false;
  }

  set(values) {
    this.dicesValues = values;
    this.render();
  }

  render() {
    // Пустой
    if (this.dicesValues.length === 0) {
      this.placeholderNode.classList.add("_active");

      this.textNode.classList.remove("_active");
    }

    // 1 Кубик не отображается, тк на нем самом отображается результат

    // Больше 1 кубика
    else if (this.dicesValues.length > 1) {
      this.placeholderNode.classList.remove("_active");

      this.textNode.textContent = this.dicesValues.reduce((acc, i) => acc + i, 0);
      this.textNode.classList.add("_active");
    }
  }

  reset() {
    this.dicesValues = [];
    this.render();
  }
}
