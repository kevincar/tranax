
/* global Item, waitForElement, Transaction, waitForElementNot */

class Order {
    constructor(orderNumber, orderDate, orderType, subtotal_initial, savings, subtotal_final, delivery_fee, minimum_fee, bag_fee, tax, driver_tip, total, items, transactions) {
        this.orderNumber = orderNumber;
        this.orderDate = orderDate;
        this.orderType = orderType;
        this.subtotal_initial = subtotal_initial;
        this.savings = savings;
        this.subtotal_final = subtotal_final;
        this.delivery_fee = delivery_fee;
        this.minimum_Fee = minimum_fee;
        this.bag_fee = bag_fee;
        this.tax = tax;
        this.driver_tip = driver_tip;
        this.total = total;
        this.items = items;
        this.transactions = transactions;
    }

    static async fromPage(stub) {
        const orderNumber = document.querySelector(".print-bill-bar-id").innerText;
        const transactions = await Order.loadTransactions(orderNumber);
        const items = [... document.querySelectorAll("div[data-testid='itemtile-stack']")].map(e => Item.fromElement(e));
        return new Order(
            orderNumber,
            stub.orderDate,
            stub.orderType,
            this.loadSubtotalInitial(), 
            this.loadSavings(),
            this.loadSubtotalFinal(),
            this.loadDeliveryFee(),
            this.loadMinimumFee(),
            this.loadBagFee(),
            this.loadTaxes(),
            this.loadDriverTip(),
            this.loadTotal(),
            items,
            transactions
        );
    }

    static hasSavings() {
        return this.loadSavings() < 0;
    }

    static async loadTransactions(orderNumber) {
        // Open Bar
        let ctaButton = document.querySelector("button[data-testid='charge-history-cta']");
        if (ctaButton != null) {
            ctaButton.click();
            await sleep(2000);
            await waitForElement("h4");

            let transactions = Transaction.fromPage(orderNumber);

            document.querySelector("button[aria-label='close panel']").click();
            await sleep(2000);
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
        if (!this.hasSavings()) {
            console.log("No Savings... No subtotal initial!");
            return NaN;
        }

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

    static loadSubtotalFinal() {
        const spans = Array.from(document.querySelectorAll("span"));
        const potSpans = spans.filter(e => e.ariaLabel?.includes("savings"));
        const noAria = potSpans.length == 0;
        const subtotalSpans = noAria ? spans.filter(e => e.textContent.includes("Subtotal")) : potSpans;

        if (subtotalSpans.length == 0) {
            console.log("No subtotal spans found!");
            return NaN;
        }

        const subtotalSpan = subtotalSpans[0];
        const subtotalContent = noAria ? subtotalSpan.parentNode.parentNode.children[1].textContent : subtotalSpan.textContent;
        const subtotalText = subtotalContent.replace("$", "").trim();

        return parseFloat(subtotalText);
    }

    static loadSavings() {
        const spans = Array.from(document.querySelectorAll("span"));
        const savingSpans = spans.filter(e => e.textContent.includes("Savings"));
        if (savingSpans.length == 0) {
            console.log("No savings spans found!");
            return NaN;
        }
        const savingSpan = savingSpans[0];
        const isGas = savingSpan.textContent.includes("Gas");
        const savingDiv = isGas? savingSpan.parentNode.parentNode : savingSpan.parentNode;
        const savingContent = isGas ? Array.from(savingDiv.children).at(-1) : savingDiv.children[2];
        const savingText = savingContent.textContent.replace("$", "").trim();
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
        const deliveryTable = deliverySpans[0].parentElement;
        const deliveryCostDiv = Array.from(deliveryTable.children).at(-1);
        const deliverySpan = Array.from(deliveryCostDiv.children).at(-1);
        const deliveryText = deliverySpan.textContent.replace("$", "").trim();
        return parseFloat(deliveryText);
    }

    static loadMinimumFee() {
        const spans = Array.from(document.querySelectorAll("span"));
        const minimumFeeSpans = spans.filter(e => e.textContent.includes("order minimum"));
        if (minimumFeeSpans.length == 0) {
            console.log("No minimum fee spans found!");
            return NaN;
        }
        const minimumFeeTable = minimumFeeSpans[0].parentElement;
        const minimumFeeDiv = Array.from(minimumFeeTable.children).at(-1);
        const minimumFeeSpan = Array.from(minimumFeeDiv.children).at(-1);
        const minimumFeeText = minimumFeeSpan.textContent.replace("$", "").trim();
        return parseFloat(minimumFeeText);
    }

    static loadBagFee() {
        const spans = Array.from(document.querySelectorAll("span"));
        const bagFeeSpans = spans.filter(e => e.textContent.includes("Bag fee"));
        if (bagFeeSpans.length == 0) {
            console.log("No bag fee spans found!");
            return NaN;
        }
        const bagFeeTable = bagFeeSpans[0].parentElement;
        const bagFeeDiv = Array.from(bagFeeTable.children).at(-1);
        const bagFeeSpan = Array.from(bagFeeDiv.children).at(-1);
        const bagFeeText = bagFeeSpan.textContent.replace("$", "").trim();
        return parseFloat(bagFeeText);
    }

    static loadTaxes() {
        const spans = Array.from(document.querySelectorAll("span"));
        const taxSpans = spans.filter(e => e.textContent.includes("Tax"));
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
        const tipSpans = spans.filter(e => e.textContent.includes("Driver tip") && e.classList.length > 0);
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

    static async runPageTests() {
        const tests = [
            {
                label: "Order Number",
                run: () => document.querySelector(".print-bill-bar-id").innerText.trim()
            },
            {
                label: "Subtotal Initial",
                run: () => this.loadSubtotalInitial()
            },
            {
                label: "Savings",
                run: () => this.loadSavings()
            },
            {
                label: "Subtotal Final",
                run: () => this.loadSubtotalFinal()
            },
            {
                label: "Delivery Fee",
                run: () => this.loadDeliveryFee()
            },
            {
                label: "Minimum Fee",
                run: () => this.loadMinimumFee()
            },
            {
                label: "Bag Fee",
                run: () => this.loadBagFee()
            },
            {
                label: "Taxes",
                run: () => this.loadTaxes()
            },
            {
                label: "Driver Tip",
                run: () => this.loadDriverTip()
            },
            {
                label: "Total",
                run: () => this.loadTotal()
            },
            {
                label: "Card Number",
                run: () => this.loadCardNumber()
            },
            {
                label: "Items Found",
                run: () => document.querySelectorAll("div[data-testid='itemtile-stack']").length
            },
            {
                label: "Transactions Found",
                run: async () => {
                    const orderNumber = document.querySelector(".print-bill-bar-id").innerText.trim();
                    const transactions = await this.loadTransactions(orderNumber);
                    return transactions.length;
                }
            }
        ];

        const results = [];
        for (const test of tests) {
            try {
                const value = await test.run();
                results.push({
                    label: test.label,
                    result: this.serializeTestValue(value)
                });
            } catch (error) {
                results.push({
                    label: test.label,
                    result: `ERROR: ${error.message}`
                });
            }
        }

        return results;
    }

    static serializeTestValue(value) {
        if (value === undefined || value === null) {
            return "";
        }

        if (Number.isNaN(value)) {
            return "NaN";
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === "object") {
            return JSON.stringify(value);
        }

        return String(value);
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
            "delivery_fee",
            "minimum_fee",
            "bag_fee",
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

    get orderId() {
        return parseInt(this.orderNumber.replace(/-/g, "").match(/\d+/)[0]);
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
