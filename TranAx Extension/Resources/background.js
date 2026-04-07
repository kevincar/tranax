browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received request:", request);

  if (request.greeting === "hello") {
    const version = browser.runtime.getManifest().version
    return Promise.resolve({ action: "monitor", version: version });
  }

  if (request.action === "download_tsv") {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0) {
        console.log("Forwarding message to tab id:", tabs[0].id);
        return browser.tabs.sendMessage(tabs[0].id, request);
      }

      console.warn("No active tab found.");
      return { ok: false, error: "No active tab found." };
    });
  }

  if (request.action === "run_order_tests") {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs.length > 0) {
        console.log("Forwarding test request to tab id:", tabs[0].id);
        return browser.tabs.sendMessage(tabs[0].id, request);
      }

      console.warn("No active tab found.");
      return { ok: false, error: "No active tab found.", results: [] };
    });
  }
});
