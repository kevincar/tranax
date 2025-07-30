# TranAx ![Tranax](https://github.com/kevincar/tranax/raw/refs/heads/main/TranAx%20Extension/Resources/images/icon-48.png)  Safari Web Extension

**TranAx** is a Safari Web Extension designed to run on specific pages (such
as `walmart.com/orders`) and help users extract transaction data. It
integrates directly into the browser via a toolbar.

## 🚀 How to Build and Run

```bash
sh scripts/build.sh
```

## 🧪 Testing

- Navigate to `https://www.walmart.com/orders`
- Click the **toolbar icon** 
- Select the date up to which you would like to gather transaction data
    - As of now, the extension will pull data starting from whatever page you
      browser is looking at and continue pulling until the date specified.
- Ensure that your browser auto allows downloads from the website, as two TSV
  files will be downloaded automatically upon completion
    1. Orders - a list of items ordered in each order
    2. Transaction - a list of the charges made for each order


## 📜 License

GNU Public License – © 2025
