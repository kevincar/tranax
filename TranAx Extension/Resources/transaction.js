class Transaction {
    constructor(orderNumber, date, time, type, title, cost, cardNumber) {
        this.orderNumber = orderNumber;
        this.date = date;
        this.time = time;
        this.type = type;
        this.title = title;
        this.cost = cost;
        this.cardNumber = cardNumber;
    }

    static fromPage(orderNumber) {
        let startingElement = document.querySelector("h3[aria-label*='Ending']").parentElement;
        let children = [... startingElement.children].filter(e => e.tagName == "H3" || (e.tagName == "DIV" && e.className == ""));
        let cardNumber = children[0].innerText.split(" ").splice(-1)[0]
        let transaction_data = [];
        let curType = "";
        children.slice(1, children.length).forEach(e => {
            let typeElement = e.querySelector("h4");
            let dataElement = e.querySelector("h5");
            if (typeElement != null) {
                curType = typeElement.innerText;
            }
            else if (dataElement != null) {
                let date = new Date(dataElement.innerText);
                let trans_objs = [... e.querySelectorAll("li")].map(e => {
                    return {
                        date: date,
                        time: [... e.querySelectorAll(".lh-copy")].at(-1).innerText,
                        type: curType,
                        title: e.querySelector("h6").innerText,
                        cost: parseFloat(e.querySelector(".items-end").innerText.trim().slice(1, 1000))
                    };
                });
                transaction_data = transaction_data.concat(trans_objs);
            }
        });

        return transaction_data.map(e => new Transaction(orderNumber, e.date, e.time, e.type, e.title, e.cost, cardNumber));
    }

    static get headerText() {
        return [
            "date",
            "time",
            "type",
            "title",
            "cost",
            "cardNumber"
        ].join("\t");
    }

    get rowText() {
        return [
            this.date.toISOString(),
            this.time,
            this.type,
            this.tite,
            this.cost,
            this.cardNumber
        ].join("\t");
    }
}
