class Item {
    constructor(name, quantity, cost) {
        this.name = name;
        this.quantity = quantity;
        this.cost = cost;
    }

    static fromElement(object) {
        let name = object.querySelector("[data-testid='productName']").innerText.trim();
        let quantity = parseInt(object.querySelector(".bill-item-quantity").innerText.split(" ")[1])
        let cost = parseFloat(object.querySelector("[data-testid='line-price']").innerText.slice(1, 50))
        return new Item(name, quantity, cost);
    }

    static get headerText() {
        return ["item name", "item quantity", "item cost"].join("\t");
    }

    get rowText() {
        return [
            this.name,
            this.quantity,
            this.cost
        ].join("\t");
    }
}
