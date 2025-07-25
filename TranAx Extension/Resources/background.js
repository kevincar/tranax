browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received request:", request);

  if (request.greeting === "hello") {
    return Promise.resolve({ action: "monitor" });
  }

  if (request.action === "download_tsv") {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0) {
        console.log("Forwarding message to tab id:", tabs[0].id);
        browser.tabs.sendMessage(tabs[0].id, request);
      } else {
        console.warn("No active tab found.");
      }
    });
  }
});

