class OrderStub {
    constructor(orderNumber, orderType, orderDate, button, canceled = false, fulfilled = true) {
        this.orderNumber = orderNumber;
        this.orderType = orderType;
        this.orderDate = orderDate;
        this.button = button;
        this.canceled = canceled;
        this.fulfilled = fulfilled;
    }

    static fromElement(object) {
        let orderNumber = object.querySelector("h2 span").innerText;
        let orderType = object.querySelector("[id*='caption']").innerText;

        let boldText = object.querySelector("h3");
        let canceled = boldText.innerText == "Canceled"
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
        let button = object.querySelector("button");
        return new OrderStub(orderNumber, orderType, orderDate, button, canceled, fulfilled);
    }
}
