
/* global Item, waitForElement, Transaction, waitForElementNot */

class Order {
    constructor(orderNumber, orderDate, orderType, tax, subtotal, total, items, transactions) {
        this.orderNumber = orderNumber;
        this.orderDate = orderDate;
        this.orderType = orderType;
        this.tax = tax;
        this.subtotal = subtotal;
        this.total = total;
        this.items = items;
        this.transactions = transactions;
    }

    static async fromPage(stub) {
        let tax = parseFloat(document.querySelector(".print-fees-item .items-end").innerText.trim().substr(1));
        let subtotal = Order.loadSubtotal();
        let total = parseFloat(document.querySelector(".bill-order-total-payment").innerText.trim().split("\n").at(-1).substr(1));
        let transactions = await Order.loadTransactions(stub.orderNumber);
        let items = [... document.querySelectorAll("div[data-testid='itemtile-stack']")].map(e => Item.fromElement(e));
        return new Order(stub.orderNumber, stub.orderDate, stub.orderType, tax, subtotal, total, items, transactions);
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
                parseFloat(document.querySelector(".bill-order-total-payment").innerText.trim().split("\n").at(-1).substr(1)),
                document.querySelector(".bill-order-payment-card").innerText.trim().split(" ").at(-1)
            )]
        }
    }

    static loadSubtotal() {
        let e = document.querySelector(".bill-order-payment-subtotal span");
        if (!e) e = document.querySelector("[aria-label*='Subtotal']").parentElement.children[1];
        return parseFloat(e.innerText.trim().substr(1));
    }

    static toItemTSV(orders) {
        return [Order.itemHeaderText, ...orders.map(e => e.itemRowText)].join("\n");
    }

    static toTranTSV(orders) {
        return [Order.tranHeaderText, ...orders.map(e => e.tranRowText)].join("\n");
    }

    static get itemHeaderText() {
        let headerNames = [
            "orderNumber",
            "orderDate",
            "orderType",
            Item.headerText,
            "tax",
            "subtotal",
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
            this.tax,
            this.subtotal,
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
