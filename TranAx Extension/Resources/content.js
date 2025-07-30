
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
        let orderElements = [...document.querySelectorAll("[data-testid*='orderGroup']")];
        for (let i = 0; i < orderElements.length; i++) {
            if (orders.length > 0 && orders.at(-1).orderDate <= toDate) break;
            let orderStubElement = document.querySelector(`[data-testid='orderGroup-${i}']`);
            let orderStub = OrderStub.fromElement(orderStubElement);
            if (!orderStub.fulfilled) continue;

            // Enter the order
            orderStub.button.click();
            await waitForElement(".print-bill-body");
            let order = await Order.fromPage(orderStub);
            orders = orders.concat([order]);
           
            // go back
            //document.querySelector("[link-identifier='Purchase history']").click();
            window.history.back();
            await waitForElement("[data-testid*='orderGroup']");
            console.log(`Order: ${orders}`);
        }

        // next page
        let url = location.href;
        document.querySelector("button[data-automation-id='next-pages-button']").click();
        await waitForLocationChange(url);
        await waitForElement("button[data-automation-id='next-pages-button']");

    } while(orders.at(-1).orderDate > toDate)
    
    let itemTSVContent = Order.toItemTSV(orders);
    downloadTSV("order_items.tsv", itemTSVContent);

    await sleep(1000);

    let tranTSVContent = Order.toTranTSV(orders);
    downloadTSV("order_transactions.tsv", tranTSVContent);
}


browser.runtime.sendMessage({ greeting: "hello" }).then((response) => {
    console.log("Received response: ", response);
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == "download_tsv")  (async () => {await gatherData(new Date(request.date))})();
});
