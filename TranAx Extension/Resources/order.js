
/* global Item, waitForElement, Transaction, waitForElementNot */

class OrderValidationError extends Error {
    constructor(orderNumber, field, value) {
        super(`Order ${orderNumber}: required field "${field}" could not be extracted (value: ${value}).`);
        this.name = "OrderValidationError";
        this.orderNumber = orderNumber;
        this.field = field;
        this.value = value;
    }
}

class Order {
    static get fieldSchema() {
        return {
            required: ["subtotal_final", "tax", "total"],
            optional: ["subtotal_initial", "savings", "delivery_fee", "minimum_Fee", "bag_fee", "driver_tip"]
        };
    }

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
        const items = this.loadItems();
        const subtotalInitial = this.loadSubtotalInitial(items);
        const discounts = this.loadTotalSavings(items);
        let subtotalFinal = this.loadSubtotalFinal(items);
        if (!Number.isFinite(subtotalFinal) && Number.isFinite(subtotalInitial) && Number.isFinite(discounts)) {
            subtotalFinal = subtotalInitial - discounts;
        }

        const orderData = {
            subtotal_initial: subtotalInitial,
            savings: this.loadSavings(items),
            subtotal_final: subtotalFinal,
            delivery_fee: this.loadDeliveryFee(),
            minimum_Fee: this.loadMinimumFee(),
            bag_fee: this.loadBagFee(),
            tax: this.loadTaxes(),
            driver_tip: this.loadDriverTip(),
            total: this.loadTotal()
        };
        this.validateRequiredFields(orderNumber, orderData);

        // Capture page values before opening the charge-history panel changes the DOM.
        const transactions = await Order.loadTransactions(orderNumber);
        return new Order(
            orderNumber,
            stub.orderDate,
            stub.orderType,
            orderData.subtotal_initial,
            orderData.savings,
            orderData.subtotal_final,
            orderData.delivery_fee,
            orderData.minimum_Fee,
            orderData.bag_fee,
            orderData.tax,
            orderData.driver_tip,
            orderData.total,
            items,
            transactions
        );
    }

    static validateRequiredFields(orderNumber, orderData) {
        for (const field of this.fieldSchema.required) {
            if (!Number.isFinite(orderData[field])) {
                throw new OrderValidationError(orderNumber, field, orderData[field]);
            }
        }
    }

    static loadItems() {
        return [...document.querySelectorAll("div[data-testid='itemtile-stack']")]
            .map(element => Item.fromElement(element));
    }

    static loadItemSavings(items = null) {
        const resolvedItems = items ?? this.loadItems();
        return resolvedItems.reduce((total, item) => {
            return total + (item.included && Number.isFinite(item.discount) ? Math.abs(item.discount) : 0);
        }, 0);
    }

    static loadTotalSavings(items = null) {
        const itemSavings = this.loadItemSavings(items);
        const orderSavings = this.loadSavings(items);
        if (Number.isFinite(orderSavings)) {
            return itemSavings + Math.abs(orderSavings);
        }
        return itemSavings;
    }

    static hasSavings(items = null) {
        const savings = this.loadTotalSavings(items);
        return Number.isFinite(savings) && savings > 0;
    }

    static loadAmountForLabels(labels, root = document) {
        const normalizedLabels = labels.map(label => label.toLowerCase());
        const labelSpans = Array.from(root.querySelectorAll("span")).filter(span =>
            normalizedLabels.includes(span.textContent.trim().toLowerCase())
        );

        for (const labelSpan of labelSpans) {
            let row = labelSpan.parentElement;
            while (row != null && row !== root && row !== document.body) {
                const rowText = row.textContent.trim();
                if (rowText.length < 180) {
                    const amounts = rowText.match(/[−-]?\s*\$\s*[\d,]+(?:\.\d{1,2})?/g) ?? [];
                    if (amounts.length > 0) {
                        return parseFloat(amounts.at(-1).replace(/[$,\s]/g, "").replace("−", "-"));
                    }
                }
                row = row.parentElement;
            }
        }

        return NaN;
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

    static loadSubtotalInitial(items = null) {
        const summary = this.getPaymentSummary();
        const previousSubtotal = Array.from(summary.querySelectorAll("span"))
            .find(span => /previous subtotal/i.test(span.textContent));
        const previousAmount = previousSubtotal?.textContent.match(/[−-]?\s*\$\s*[\d,]+(?:\.\d{1,2})?/);
        if (previousAmount != null) {
            return parseFloat(previousAmount[0].replace(/[$,\s]/g, "").replace("−", "-"));
        }

        const subtotal = this.loadAmountForLabels(["Subtotal"], summary);
        const savings = this.loadTotalSavings(items);
        return Number.isFinite(subtotal) && Number.isFinite(savings) ? subtotal + savings : subtotal;
    }

    static loadSubtotalFinal(items = null) {
        return this.loadAmountForLabels(["Subtotal"], this.getPaymentSummary());
    }

    static getPaymentSummary() {
        const summaries = Array.from(document.querySelectorAll(".bill-order-payment-spacing"));
        return summaries.reverse().find(summary =>
            Array.from(summary.querySelectorAll("span")).some(span => span.textContent.trim() === "Subtotal")
        ) ?? document;
    }

    static loadDisplayedSavings() {
        const summary = this.getPaymentSummary();
        const spans = Array.from(summary.querySelectorAll("span"));
        const label = spans.find(span => /^(savings|promotion)$/i.test(span.textContent.trim()));
        if (label == null) return NaN;

        let row = label.parentElement;
        while (row != null && row !== summary && row !== document.body) {
            const amounts = row.textContent.match(/[−-]?\s*\$\s*[\d,]+(?:\.\d{1,2})?/g) ?? [];
            if (amounts.length > 0) {
                return parseFloat(amounts.at(-1).replace(/[$,\s]/g, "").replace("−", "-"));
            }
            row = row.parentElement;
        }
        return NaN;
    }

    static loadSavings(items = null) {
        const displayedSavings = this.loadDisplayedSavings();
        const itemSavings = this.loadItemSavings(items);
        if (!Number.isFinite(displayedSavings)) {
            return itemSavings > 0 ? 0 : displayedSavings;
        }

        const residualSavings = Math.max(Math.abs(displayedSavings) - itemSavings, 0);
        return displayedSavings < 0 ? -residualSavings : residualSavings;
    }

    static loadDeliveryFee() {
        return this.loadAmountForLabels(["Delivery", "Delivery fee", "Shipping"], this.getPaymentSummary()) || 0;
    }

    static loadMinimumFee() {
        return this.loadAmountForLabels(["Order minimum", "Minimum fee"], this.getPaymentSummary()) || 0;
    }

    static loadBagFee() {
        return this.loadAmountForLabels(["Bag fee"], this.getPaymentSummary()) || 0;
    }

    static loadTaxes() {
        return this.loadAmountForLabels(["Taxes", "Tax"], this.getPaymentSummary());
    }

    static loadDriverTip() {
        return this.loadAmountForLabels(["Driver tip", "Tip"], this.getPaymentSummary()) || 0;
    }

    static loadTotal() {
        return this.loadAmountForLabels(["Total"], this.getPaymentSummary());
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
            this.minimum_Fee,
            this.bag_fee,
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
