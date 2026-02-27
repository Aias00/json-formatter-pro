// Background service worker for JSON Formatter Pro
// Opens the main page in a new tab when extension icon is clicked

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('popup.html')
  });
});
