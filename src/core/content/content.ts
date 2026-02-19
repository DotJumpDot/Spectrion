const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
  (this as HTMLElement).remove();
};
(document.head || document.documentElement).appendChild(script);

setInterval(() => {
  if ((window as any).spectrionApiCalls && (window as any).spectrionApiCalls.length > 0) {
    chrome.runtime.sendMessage({
      type: 'CONTENT_API_CALLS',
      apiCalls: (window as any).spectrionApiCalls,
    });
    (window as any).spectrionApiCalls = [];
  }
}, 1000);
