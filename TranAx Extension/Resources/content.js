
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
        let orderElements = [...document.querySelectorAll("[data-testid*='order-']")].filter(e => e.attributes["data-testid"].value.match(/order-\d+/) != null);
        for (let i = 0; i < orderElements.length; i++) {
            if (orders.length > 0 && orders.at(-1).orderDate <= toDate) break;
            let orderStubElement = document.querySelector(`[data-testid='order-${i}']`);
            let orderStub = OrderStub.fromElement(orderStubElement);
            if (!orderStub.fulfilled) continue;

            // If the order is already in the set...
            if (orders.find(o => o.orderId == orderStub.orderId)) {
                console.log(`Duplicate order number: ${orderStub.orderId}`);
                continue;
            }

            // Enter the order
            orderStub.button.click();
            await waitForElement(".print-bill-body");
            let order = await Order.fromPage(orderStub);
            orders = orders.concat([order]);
           
            // go back
            //document.querySelector("[link-identifier='Purchase history']").click();
            await sleepvar(3000, 8000);
            window.history.back();
            await sleepvar(3000, 8000);
            await waitForElement("[data-testid*='orderGroup']");
            console.log(`Order: ${orders}`);
        }

        // next page
        const originalOrderText = document.querySelector("[data-testid='order-0']").textContent;
        document.querySelector("button[data-automation-id='next-pages-button']").click();
        await sleepvar(2000, 8000);
        await waitForElementContentChange("[data-testid='order-0']", 20000, el => el.textContent, originalOrderText);
        await waitForElement("button[data-automation-id='next-pages-button']");

    } while(orders.at(-1).orderDate > toDate)
    
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
