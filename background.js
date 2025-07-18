// Inject content.js when user clicks the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    console.log('content.js injected');

    // Open side panel (optional - if you want it opened after injection)
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Injection failed:', error);
  }
});

// Side panel behavior on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true;
  }

  if (request.action === 'getTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ tab: tabs[0] });
    });
    return true;
  }
});

// Sync step updates to all content scripts
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.recordingSteps) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'stepsUpdated',
          steps: changes.recordingSteps.newValue
        }).catch(() => {}); // ignore if no content script in tab
      });
    });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const manifest = chrome.runtime.getManifest();
  const contentScripts = manifest.content_scripts || [];

  for (const cs of contentScripts) {
    const tabs = await chrome.tabs.query({}); // get all tabs

    for (const tab of tabs) {
      // Check if tab matches any of the content script's match patterns
      if (cs.matches.some(pattern => new URL(tab.url).href.match(patternToRegex(pattern)))) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: cs.js,
          });
          console.log(`Re-injected ${cs.js} into tab ${tab.id}`);
        } catch (error) {
          console.warn(`Failed to inject into tab ${tab.id}:`, error);
        }
      }
    }
  }
});

// Helper to convert match pattern to regex
function patternToRegex(pattern) {
  return new RegExp('^' + pattern
    .replace(/\*/g, '.*')
    .replace(/\./g, '\\.')
    .replace(/\//g, '\\/') + '$');
}
