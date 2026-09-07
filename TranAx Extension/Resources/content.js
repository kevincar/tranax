
/* global browser, OrderStub, waitForElement, Order, waitForLocationChange, sleep */

function downloadTSV(filename, tsvContent) {
  const blob = new Blob([tsvContent], { type: "text/tsv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function gatherData(toDate) {
    let orders = [];

    do {
        let orderIndex = 0;
        while (true) {
            // Keep only stable identifiers between navigations; re-query the element before using it.
            const orderTestIds = [...document.querySelectorAll("[data-testid]")]
                .map(element => element.getAttribute("data-testid"))
                .filter(testId => /^(?:order-\d+|orderGroup-\d+)$/.test(testId));
            if (orderIndex >= orderTestIds.length) break;

            if (orders.length > 0 && orders.at(-1).orderDate <= toDate) break;
            const orderTestId = orderTestIds[orderIndex++];
            const orderStubElement = document.querySelector(`[data-testid='${orderTestId}']`);
            if (orderStubElement == null) continue;

            let orderStub = OrderStub.fromElement(orderStubElement);
            if (!orderStub.fulfilled) continue;

            // If the order is already in the set...
            if (orders.find(o => o.orderId == orderStub.orderId)) {
                console.log(`Duplicate order number: ${orderStub.orderId}`);
                continue;
            }

            // Enter the order
            orderStub.button.click();
            await sleepvar(3000, 8000);
            await waitForElement("main");
            let order = await Order.fromPage(orderStub);
            orders = orders.concat([order]);
           
            // go back
            //document.querySelector("[link-identifier='Purchase history']").click();
            await sleepvar(3000, 8000);
            window.history.back();
            await sleepvar(3000, 8000);
            await waitForElement("[data-testid='orderGroup-0'], [data-testid='order-0']");
            console.log(`Order: ${orders}`);
        }

        // next page
        const firstOrderTestId = [...document.querySelectorAll("[data-testid]")]
            .map(element => element.getAttribute("data-testid"))
            .find(testId => /^(?:order-\d+|orderGroup-\d+)$/.test(testId));
        const nextPageButton = document.querySelector("button[data-automation-id='next-pages-button']");
        if (firstOrderTestId == null || nextPageButton == null || nextPageButton.disabled) break;

        const firstOrderSelector = `[data-testid='${firstOrderTestId}']`;
        const originalOrderText = document.querySelector(firstOrderSelector).textContent;
        nextPageButton.click();
        await sleepvar(2000, 8000);
        await waitForElementContentChange(firstOrderSelector, 20000, el => el.textContent, originalOrderText);

    } while(orders.length > 0 && orders.at(-1).orderDate > toDate)
    
    let itemTSVContent = Order.toItemTSV(orders);
    downloadTSV("order_items.tsv", itemTSVContent);

    await sleepvar(2000, 8000);

    let tranTSVContent = Order.toTranTSV(orders);
    downloadTSV("order_transactions.tsv", tranTSVContent);
}


browser.runtime.sendMessage({ greeting: "hello" }).then((response) => {
    console.log("Received response: ", response);
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == "download_tsv") {
        return (async () => {
            await gatherData(new Date(request.date));
            return { ok: true };
        })();
    }

    if (request.action == "run_order_tests") {
        return (async () => {
            try {
                const results = await Order.runPageTests();
                return { ok: true, results: results };
            } catch (error) {
                return { ok: false, error: error.message, results: [] };
            }
        })();
    }
});
