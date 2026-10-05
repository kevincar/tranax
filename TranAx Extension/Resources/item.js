class Item {
    constructor(name, quantity, cost, discount = 0, discountedCost = cost, included = true) {
        this.name = name;
        this.quantity = quantity;
        this.cost = cost;
        this.discount = discount;
        this.discountedCost = discountedCost;
        this.included = included;
    }

    static parseMoney(text) {
        const match = String(text ?? "").match(/[−-]?\s*\$\s*[\d,]+(?:\.\d{2})?/);
        if (match == null) return NaN;

        return parseFloat(
            match[0]
                .replace("$", "")
                .replaceAll(",", "")
                .replace("−", "-")
                .replace(/\s/g, "")
        );
    }

    static parseDisplayedPrice(element) {
        if (element == null) return NaN;

        const text = element.innerText ?? element.textContent ?? "";
        if (/\.\d{2}/.test(text)) {
            return this.parseMoney(text);
        }

        // Some pages render dollars and cents in separate spans without a decimal.
        const dollars = element.querySelector(".f2")?.textContent.trim();
        const cents = Array.from(element.querySelectorAll("span.f6"))
            .map(span => span.textContent.trim())
            .find(value => /^\d{2}$/.test(value));
        if (dollars != null && cents != null) {
            return parseFloat(`${dollars}.${cents}`);
        }

        return this.parseMoney(text);
    }

    static fromElement(object) {
        let name = object.querySelector("[data-testid='productName']").innerText.trim();
        let quantity = parseInt(object.querySelector(".bill-item-quantity").innerText.split(" ")[1]);
        const category = object.closest?.("[data-testid^='category-accordion-']");
        const categoryText = category?.getAttribute("data-testid") ?? "";
        const statusText = object.querySelector(".bill-order-weight-adjust")?.innerText ?? "";
        const included = !/unavailable|not included/i.test(`${categoryText} ${statusText}`);
        const linePrice = object.querySelector("[data-testid='line-price']");
        const discountedCost = this.parseDisplayedPrice(linePrice);

        const priceColumn = linePrice?.parentElement?.parentElement;
        const originalPrice = Array.from(priceColumn?.children ?? [])
            .find(child => !child.contains(linePrice) && Number.isFinite(this.parseMoney(child.innerText)));
        const cost = originalPrice == null
            ? discountedCost
            : this.parseMoney(originalPrice.innerText);

        const discountElements = Array.from(object.querySelectorAll(".bill-item-party-text span"));
        const displayedDiscounts = discountElements
            .map(element => this.parseMoney(element.innerText))
            .filter(amount => Number.isFinite(amount));
        const displayedDiscount = displayedDiscounts.length == 0
            ? NaN
            : displayedDiscounts.reduce((total, amount) => total + Math.abs(amount), 0);
        const discount = Number.isFinite(displayedDiscount)
            ? Math.abs(displayedDiscount)
            : (Number.isFinite(cost) && Number.isFinite(discountedCost)
                ? Math.max(cost - discountedCost, 0)
                : NaN);

        return new Item(name, quantity, cost, discount, discountedCost, included);
    }

    static get headerText() {
        return ["item name", "item quantity", "item cost", "item discount", "item discounted cost", "item included"].join("\t");
    }

    get rowText() {
        return [
            this.name,
            this.quantity,
            this.cost,
            this.discount,
            this.discountedCost,
            this.included
        ].join("\t");
    }
}
