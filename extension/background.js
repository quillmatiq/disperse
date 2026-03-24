chrome.action.onClicked.addListener((tab) => {
  const url = `https://disperse.social/share?url=${encodeURIComponent(tab.url ?? "")}`;
  chrome.windows.create({ url, type: "popup", width: 540, height: 800 });
});
