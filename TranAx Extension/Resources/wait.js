function waitForElement(selector, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (timeout) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    }
  });
}

function waitForElementNot(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (!el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el == null) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (timeout) {
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector} to be removed`));
      }, timeout);
    }
  });
}

function waitForLocationChange(oldHref, timeout = 10000, interval = 100) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      if (location.href !== oldHref) {
        resolve(location.href);
      } else if (Date.now() - start > timeout) {
        reject(new Error("Timed out waiting for location.href to change"));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

function waitForElementContentChange(selector, timeout = 20000, getValue = el => el.textContent, originalValue, settleTime = 0) {
  return new Promise((resolve, reject) => {
    let observer = null;
    let timer = null;
    let settleTimer = null;

    const cleanup = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    const finish = (error, el) => {
      cleanup();
      if (error) reject(error);
      else resolve(el);
    };

    const initialElement = document.querySelector(selector);
    const initialValue = originalValue === undefined && initialElement
      ? getValue(initialElement)
      : originalValue;

    const checkForChange = () => {
      const el = document.querySelector(selector);
      if (!el) return;

      const currentValue = getValue(el);
      const hasChanged = initialValue === undefined || currentValue !== initialValue;

      if (!hasChanged) {
        if (settleTimer) {
          clearTimeout(settleTimer);
          settleTimer = null;
        }
        return;
      }

      if (!settleTime) {
        finish(null, el);
        return;
      }

      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const currentElement = document.querySelector(selector);
        if (!currentElement) return;

        const settledValue = getValue(currentElement);
        const isStillChanged = initialValue === undefined || settledValue !== initialValue;
        if (isStillChanged) {
          finish(null, currentElement);
        }
      }, settleTime);
    };

    checkForChange();

    observer = new MutationObserver(checkForChange);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });

    if (timeout) {
      timer = setTimeout(() => {
        finish(new Error(`Timeout waiting for content change in ${selector}`));
      }, timeout);
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sleepvar(min, max) {
  let value = Math.floor(Math.random() * (max - min + 1)) + min;
  return sleep(value);
}
