class OrderStub {
    constructor(orderId, orderType, orderDate, button, canceled = false, fulfilled = true) {
        this.orderId = orderId;
        this.orderType = orderType;
        this.orderDate = orderDate;
        this.button = button;
        this.canceled = canceled;
        this.fulfilled = fulfilled;
    }

    static fromElement(object) {
        const orderTypeObj = object.querySelector("[id*='caption']");
        const orderIdMatch = orderTypeObj.id.match(/caption-(\d+)-*/);
        const orderId = orderIdMatch ? parseInt(orderIdMatch[1]) : null;
        const orderType = orderTypeObj.innerText;

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
        return new OrderStub(orderId, orderType, orderDate, button, canceled, fulfilled);
    }
}
