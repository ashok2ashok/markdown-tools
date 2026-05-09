chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'c2md-selection',
    title: 'Copy as Markdown',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'c2md-table',
    title: 'Copy table as Markdown',
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    id: 'c2md-separator',
    type: 'separator',
    contexts: ['page', 'frame'],
  });

  chrome.contextMenus.create({
    id: 'c2md-page',
    title: 'Copy page as Markdown',
    contexts: ['page', 'frame'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const actionMap = {
    'c2md-selection': 'copySelection',
    'c2md-table':     'copyTable',
    'c2md-page':      'copyPage',
  };
  const action = actionMap[info.menuItemId];
  if (action && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action });
  }
});

// Toolbar icon click → open full-page editor
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('page/index.html') });
});
