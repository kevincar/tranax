class OrderStub {
    constructor(orderType, orderDate, button, canceled = false, fulfilled = true) {
        this.orderType = orderType;
        this.orderDate = orderDate;
        this.button = button;
        this.canceled = canceled;
        this.fulfilled = fulfilled;
    }

    static fromElement(object) {
        const orderType = object.querySelector("[id*='caption']").innerText;

        const boldText = object.querySelector("h2");
        const canceled = boldText.innerText == "Canceled"
        let orderDate = new Date();
        let fulfilled = true;
        if (!canceled) {
            let dateMatch = boldText.innerText.match(/\w{3,9} \d{2}(, \d{4})?/);
            if (dateMatch == null) {
                orderDate = new Date();
                fulfilled = false;
            }
            else {
                let someDate = new Date(dateMatch[0]);
                let year = (dateMatch[1] == null) ? (new Date()).getYear() + 1900 : dateMatch[1].match(/\d{4}/)[0];
                let month = someDate.getMonth();
                let day = someDate.getDate();
                orderDate = dateMatch[1] != null ?someDate : new Date(year, month, day);
            }
        }
        let button = object.querySelector("button[data-automation-id*='view-order-details']");
        return new OrderStub(orderType, orderDate, button, canceled, fulfilled);
    }
}
