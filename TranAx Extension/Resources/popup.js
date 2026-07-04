function initDate() {
    const yearSelect = document.getElementById("year");
    const monthSelect = document.getElementById("month");
    const daySelect = document.getElementById("day");

    // Fill years (e.g., 2000–2030)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 10; y <= currentYear + 5; y++) {
        yearSelect.add(new Option(y, y));
    }

    // Fill months
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    monthNames.forEach((name, index) => {
        monthSelect.add(new Option(name, index + 1));
    });

    // Populate days based on selected year/month
    function populateDays() {
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);
        const daysInMonth = new Date(year, month, 0).getDate();

        daySelect.innerHTML = ""; // Clear previous options
        for (let d = 1; d <= daysInMonth; d++) {
            daySelect.add(new Option(d, d));
        }
    }

    // Trigger update when year or month changes
    yearSelect.addEventListener("change", populateDays);
    monthSelect.addEventListener("change", populateDays);

    // Initialize with today's date
    function setToday() {
        const today = new Date();
        yearSelect.value = today.getFullYear();
        monthSelect.value = today.getMonth() + 1;
        populateDays();
        daySelect.value = today.getDate();
    }

    setToday();
}

const testLabels = [
    "Order Number",
    "Subtotal Initial",
    "Savings",
    "Subtotal Final",
    "Delivery Fee",
    "Minimum Fee",
    "Bag Fee",
    "Taxes",
    "Driver Tip",
    "Total",
    "Card Number",
    "Items Found",
    "Transactions Found"
];

function renderBlankTestRows() {
    const tbody = document.getElementById("test-results-body");
    tbody.innerHTML = "";

    testLabels.forEach((label) => {
        const row = document.createElement("tr");
        const labelCell = document.createElement("td");
        const resultCell = document.createElement("td");

        labelCell.textContent = label;
        resultCell.textContent = "";

        row.append(labelCell, resultCell);
        tbody.append(row);
    });
}

function renderTestResults(results) {
    const tbody = document.getElementById("test-results-body");
    tbody.innerHTML = "";

    results.forEach(({ label, result }) => {
        const row = document.createElement("tr");
        const labelCell = document.createElement("td");
        const resultCell = document.createElement("td");

        labelCell.textContent = label;
        resultCell.textContent = result ?? "";

        row.append(labelCell, resultCell);
        tbody.append(row);
    });
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.toggle("hidden", page.id !== pageId);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Extension version:", browser.runtime.getManifest().version);

    const message = document.getElementById("message");
    const content = document.getElementById("content");
    const mainPageId = "main-page";
    const testStatus = document.getElementById("test-status");
    const downloadButton = document.getElementById("download-btn");
    const openTestButton = document.getElementById("open-test-btn");
    const backButton = document.getElementById("back-btn");
    const runTestsButton = document.getElementById("run-tests-btn");

    renderBlankTestRows();

    openTestButton.addEventListener("click", () => {
        testStatus.textContent = "";
        showPage("test-page");
    });

    backButton.addEventListener("click", () => {
        testStatus.textContent = "";
        showPage(mainPageId);
    });

    downloadButton.addEventListener("click", () => {
        const date = new Date(
            document.getElementById("year").value,
            document.getElementById("month").value - 1,
            document.getElementById("day").value
        );
        const dateString = date.toISOString();
        console.log("Sending message");
        browser.runtime.sendMessage({
            action: "download_tsv",
            date: dateString
        });
    });

    runTestsButton.addEventListener("click", async () => {
        testStatus.textContent = "Running tests...";
        renderBlankTestRows();

        try {
            const response = await browser.runtime.sendMessage({
                action: "run_order_tests"
            });

            if (!response?.ok) {
                throw new Error(response?.error || "Unable to run tests.");
            }

            renderTestResults(response.results || []);
            testStatus.textContent = "";
        } catch (error) {
            testStatus.textContent = error.message;
        }
    });

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const url = tabs[0]?.url || "";

        if (url.includes("walmart.com/order")) {
            content.classList.remove("hidden");
            initDate();
            showPage(mainPageId);
        } else {
            message.classList.remove("hidden");
        }
    });
});
