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

document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("message");
  const content = document.getElementById("content");

  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const url = tabs[0].url;

    if (url.includes("walmart.com/order")) {
      content.style.display = "block";
      initDate();
      let button = document.getElementById("btn");
      button.addEventListener("click", () => {
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
    } else {
      message.style.display = "block";
    }
  });
});

