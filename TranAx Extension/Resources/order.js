
/* global Item, waitForElement, Transaction, waitForElementNot */

class Order {
    constructor(orderNumber, orderDate, orderType, subtotal_initial, savings, subtotal_final, delivery_fee, tax, driver_tip, total, items, transactions) {
        this.orderNumber = orderNumber;
        this.orderDate = orderDate;
        this.orderType = orderType;
        this.subtotal_initial = subtotal_initial;
        this.savings = savings;
        this.subtotal_final = subtotal_final;
        this.delivery_fee = delivery_fee;
        this.tax = tax;
        this.driver_tip = driver_tip;
        this.total = total;
        this.items = items;
        this.transactions = transactions;
    }

    static async fromPage(stub) {
        const orderNumber = document.querySelector(".print-bill-bar-id").innerText;
        const transactions = await Order.loadTransactions(stub.orderNumber);
        const items = [... document.querySelectorAll("div[data-testid='itemtile-stack']")].map(e => Item.fromElement(e));
        return new Order(
            orderNumber,
            stub.orderDate,
            stub.orderType,
            this.loadSubtotalInitial(), 
            this.loadSavings(),
            this.loadSubtotalFinal(),
            this.loadDeliveryFee(),
            this.loadTaxes(),
            this.loadDriverTip(),
            this.loadTotal(),
            items,
            transactions
        );
    }

    static async loadTransactions(orderNumber) {
        // Open Bar
        let ctaButton = document.querySelector("button[data-testid='charge-history-cta']");
        if (ctaButton != null) {
            ctaButton.click();
            await waitForElement("h4");

            let transactions = Transaction.fromPage(orderNumber);

            document.querySelector("button[aria-label='close panel']").click();
            await waitForElementNot("h4");
            return transactions;
        } else {
            return [new Transaction(
                orderNumber,
                new Date(document.querySelector("[data-testid='orderInfoCard'] h2").innerText.split(" ").slice(0, -1).join(" ")),
                "",
                "",
                "",
                this.loadTotal(),
                this.loadCardNumber()
            )]
        }
    }

    static loadSubtotalInitial() {
        const spans = Array.from(document.querySelectorAll("span"));
        const subtotalSpans = spans.filter(e => e.textContent.includes("Previous subtotal"));
        if (subtotalSpans.length == 0) {
            console.log("No subtotal spans found!");
            return NaN;
        }
        const subtotalSpan = subtotalSpans[0];
        const subtotalDiv = subtotalSpan.parentNode;
        const subtotalText = subtotalDiv.children[1].textContent.replace("$", "").trim();
        return parseFloat(subtotalText);
    }
    static loadSubtotalFinal() {
        const spans = Array.from(document.querySelectorAll("span"));
        const subtotalSpans = spans.filter(e => e.textContent.includes("Subtotal"));
        if (subtotalSpans.length == 0) {
            console.log("No subtotal spans found!");
            return NaN;
        }
        const subtotalSpan = subtotalSpans[0];
        const subtotalDiv = subtotalSpan.parentNode;
        const subtotalText = subtotalDiv.children[1].textContent.replace("$", "").trim();
        return parseFloat(subtotalText);
    }

    static loadSavings() {
        const spans = Array.from(document.querySelectorAll("span"));
        const savingSpans = spans.filter(e => e.textContent.includes("Savings of"));
        if (savingSpans.length == 0) {
            console.log("No savings spans found!");
            return NaN;
        }
        const savingSpan = savingSpans[0];
        const savingDiv = savingSpan.parentNode;
        const savingText = savingDiv.children[1].textContent.replace("$", "").trim();
        return parseFloat(savingText);
    }

    static loadDeliveryFee() {
        // This is often 0 with Wal-Mart +
        const spans = Array.from(document.querySelectorAll("span"));
        const deliverySpans = spans.filter(e => e.textContent.includes("delivery from"));
        if (deliverySpans.length == 0) {
            console.log("No delivery spans found!");
            return NaN;
        }
        const deliveryTable = deliverySpans.at(-1).parentElement.parentElement.parentElement;
        const deliveryCostDiv = Array.from(deliveryTable.children).at(-1);
        const deliverySpan = Array.from(deliveryCostDiv.children).at(-1);
        const deliveryText = deliverySpan.textContent.replace("$", "").trim();
        return parseFloat(deliveryText);
    }

    static loadTaxes() {
        const spans = Array.from(document.querySelectorAll("span"));
        const taxSpans = spans.filter(e => e.textContent.includes("Taxes"));
        if (taxSpans.length == 0) {
            console.log("No tax spans found!");
            return NaN;
        }
        const taxSpan = taxSpans[0];
        const taxDiv = taxSpan.parentNode;
        const taxText = Array.from(taxDiv.children).at(-1).textContent.replace("$", "").trim();
        return parseFloat(taxText);
    }

    static loadDriverTip() {
        const spans = Array.from(document.querySelectorAll("span"));
        const tipSpans = spans.filter(e => e.textContent.includes("Driver tip"));
        if (tipSpans.length == 0) {
            console.log("No tip spans found!");
            return 0;
        }
        const tipSpan = tipSpans[0];
        const tipDiv = tipSpan.parentNode;
        const tipText = Array.from(tipDiv.children).at(-1).textContent.replace("$", "").trim();
        return parseFloat(tipText);
    }

    static loadTotal() {
        const spans = Array.from(document.querySelectorAll("span"));
        const totalSpans = spans.filter(e => e.textContent.includes("Total"));
        if (totalSpans.length == 0) {
            console.log("No total spans found!");
            return NaN;
        }
        const totalSpan = totalSpans[0];
        const totalDiv = totalSpan.parentNode;
        const totalText = Array.from(totalDiv.children).at(-1).textContent.replace("$", "").trim();
        return parseFloat(totalText);
    }

    static loadCardNumber() {
        const cardDescription = document.querySelectorAll("[aria-labelledby='card-description-0']");
        if (cardDescription.length == 0) {
            console.log("No card number found!");
            return NaN;
        }
        const cardNumberFinal = Array.from(cardDescription).at(-1);
        const cardNumberText = cardNumberFinal.textContent.split(" ").at(-1);
        return parseInt(cardNumberText);
    }

    static toItemTSV(orders) {
        return [Order.itemHeaderText, ...orders.map(e => e.itemRowText)].join("\n");
    }

    static toTranTSV(orders) {
        return [Order.tranHeaderText, ...orders.map(e => e.tranRowText)].join("\n");
    }

    static get itemHeaderText() {
        const headerNames = [
            "orderNumber",
            "orderDate",
            "orderType",
            Item.headerText,
            "subtotal_initial",
            "savings",
            "subtotal_final",
            "delivery_fee"
            "tax",
            "driver_tip",
            "total"
        ];
        return headerNames.join("\t")
    }

    static get tranHeaderText() {
        return [
            "orderNumber",
            "orderType",
            Transaction.headerText
        ].join("\t")
    }

    get itemRowText() {
        return this.items.map(e => [
            this.orderNumber,
            this.orderDate.toISOString(),
            this.orderType,
            e.rowText,
            this.subtotal_initial,
            this.savings,
            this.subtotal_final,
            this.delivery_fee,
            this.tax,
            this.driver_tip,
            this.savings,
            this.total
        ].join("\t")).join("\n");
    }

    get tranRowText() {
        return this.transactions.map(e => [
            this.orderNumber,
            this.orderType,
            e.rowText
        ].join("\t")).join("\n");
    }
}
