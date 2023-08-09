/******************************************************************************

Filename: background.js

Description:
Background script of browser extension. Automates searching incident in ITSM.

******************************************************************************/

// Used to stop sending periodically messages to the tab.
let intervalId;

// Send message to the specified tab and log it.
function sendMessage(tabID, message) {
  chrome.tabs.sendMessage(tabID, message);
  console.log("Message was sent to the tab:", tabID)
}

// Open new tab of ITSM and start sending messages to the newly created tab.
function openItsmNewTabAndStartSendingMessages(message) {
  // Open new tab of ITSM.
  chrome.tabs.create({ url: "ITSM URL" }, function (tab) {

    // Save ID of opened tab.
    const targetTabId = tab.id;

    console.log("ID of created tab: ", targetTabId);

    // Register an event listener for tab updates - before interacting with the tab,
    // it has to be loaded and in "complete" status.
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      // Check if the tab is completely loaded and the status is "complete".
      if (tabId === tab.id && changeInfo.status === "complete") {
        // Unregister the event listener to avoid duplicate calls.
        chrome.tabs.onUpdated.removeListener(listener);

        // Start sending message to the tab every 0.5 second.
        intervalId = setInterval(sendMessage, 500, targetTabId, message);
      }
    });
  });
}

// Done only once at install time.
chrome.runtime.onInstalled.addListener(() => {
  // Create context menus.

  // Context menu to search incident from selected text.
  chrome.contextMenus.create({
    id: "selected_text",
    title: "Search the ITSM for \"%s\"",
    contexts: ["selection"],
  })

  // Context menu to search incident from clipboard.
  chrome.contextMenus.create({
    id: "clipboard",
    title: "Search the ITSM for incident in the clipboard",
    contexts: ["page"],
  })

  // Listener for messages from content script (tab) or popup script.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.destination === "background") {
      if (message.source === "content") {
        const targetPage = message.targetPage;
        console.log("'targetPage' flag received from content script:", targetPage);

        // If tab returned targetPage = true, it means the target page (ITSM) was reached and searching the incident has begun.
        if (targetPage) {
          // Stop sending messages to the tab.
          clearInterval(intervalId);
        }
      }
      else if (message.source === "popup") {

        const incidentId = message.incId;

        // Prepare message.
        const msg = {
          source: "background",
          destination: "content",
          context: "search incident – popup",
          incId: incidentId
        };

        console.log("Incident ID received from popup script: ", incidentId);

        openItsmNewTabAndStartSendingMessages(msg);
      }
    }
  });
});

// Listener for the context menus.
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  // User selected incident ID and wants to search the ITSM for it.
  if (info.menuItemId === "selected_text") {
    // Retrieve what user selected.
    const incidentId = info.selectionText;

    // Prepare message.
    const msg = {
      source: "background",
      destination: "content",
      context: "search incident – selected text",
      incId: incidentId
    };

    openItsmNewTabAndStartSendingMessages(msg);
  }
  // User copied incident ID to the clipboard and wants to search the ITSM for it.
  else if (info.menuItemId === "clipboard") {

    console.log("clipboard use scenario");

    // Prepare message.
    const msg = {
      source: "background",
      destination: "content",
      context: "search incident – clipboard"
    };

    // Access to the clipboard is in the content script, so the message will only tell that content script should retrieve the incident ID from the clipboard.
    openItsmNewTabAndStartSendingMessages(msg);
  }
})
