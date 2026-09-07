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
        const orderIdMatch = orderTypeObj?.id.match(/caption-(\d+)-*/);
        const orderButton = object.querySelector("button[data-automation-id*='view-order-details']");
        const buttonOrderIdMatch = orderButton?.getAttribute("aria-label")?.match(/order number (\d+)/i);
        const orderId = orderIdMatch ? parseInt(orderIdMatch[1]) : null;
        const resolvedOrderId = orderId ?? (buttonOrderIdMatch ? parseInt(buttonOrderIdMatch[1]) : null);
        const orderType = orderTypeObj?.innerText || "";

        const headings = [...object.querySelectorAll("h2, h3")];
        const canceled = headings.some(heading => heading.innerText.trim().toLowerCase() == "canceled");
        let orderDate = new Date();
        let fulfilled = true;
        if (!canceled) {
            const dateText = headings.map(heading => heading.innerText).join(" ");
            let dateMatch = dateText.match(/\b\w{3,9} \d{1,2}(, \d{4})?\b/);
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
        return new OrderStub(resolvedOrderId, orderType, orderDate, orderButton, canceled, fulfilled);
    }
}
