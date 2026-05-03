const api = typeof browser !== "undefined" ? browser : chrome;

api.action.onClicked.addListener((tab) => {
  const url = `https://disperse.social/share?url=${encodeURIComponent(tab.url ?? "")}`;
  api.windows.create({ url, type: "popup", width: 540, height: 800 });
});
