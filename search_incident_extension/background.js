/******************************************************************************

Filename: background.js

Description:
Background script of browser extension. Automates searching incident in ITSM.

******************************************************************************/

// Used to stop sending periodically messages to the tab.
let intervalId;
// Used to implement timeout (to stop sending messages after some time).
let sendedMessagesCounter;
// Flag indicating whether search can be started. If false, then no new search can be started.
let startSearch;

// Send message to the specified tab and log it.
function sendMessage(tabID, message) {
  // If messages were send for longer than 5 minutes.
  if(sendedMessagesCounter < 600){
    chrome.tabs.sendMessage(tabID, message, (response) => {
      if (chrome.runtime.lastError) {
        // Error message is logged as a regular message and not with "console.error",
        // because some errors occur here during normal usage of the extension 
        // and when everything works fine. Thanks to this the user will not get 
        // confused.
        console.log("Background - Suppressed error: ", chrome.runtime.lastError.message);
      } else {
        // Message was delivered.
        console.log("Background - Message was sent to the tab: ", tabID);
      }
    });
    sendedMessagesCounter++;
  }
  else{
    // Stop sending messages to the tab.
    clearInterval(intervalId);
    console.log("Background - Stopped sending the messages from the background to the content")
    startSearch = true;
  }
}

// Open new tab of ITSM and start sending messages to the newly created tab.
function openItsmNewTabAndStartSendingMessages(message) {
  if(startSearch)
  {
    startSearch = false;

    // Open new tab of ITSM.
    chrome.tabs.create({ url: "ITSM URL" }, function (tab) {

    // Save ID of opened tab.
    const targetTabId = tab.id;

    console.log("Background - ID of created tab: ", targetTabId);

    // Register an event listener for tab updates - before interacting with the tab,
    // it has to be loaded and in "complete" status.
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      // Check if the tab is completely loaded and the status is "complete".
      if (tabId === tab.id && changeInfo.status === "complete") {
        // Unregister the event listener to avoid duplicate calls.
        chrome.tabs.onUpdated.removeListener(listener);
        
        sendedMessagesCounter = 0;

        console.log("Background - Started sending messages to the content script");

        // Start sending message to the tab every 0.5 second.
        intervalId = setInterval(sendMessage, 500, targetTabId, message);
      }
    });
  });
  }
  else{
    console.log("Background - requested search will not start. Wait until current search starts and try again");
  }
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
        console.log("Background - 'targetPage' flag received from content script: ", targetPage);

        // If tab returned targetPage = true, it means the target page (ITSM) was reached and searching the incident has begun.
        if (targetPage) {
          // Stop sending messages to the tab and reset the flag.
          clearInterval(intervalId);
          startSearch = true;
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

        console.log("Background - Popup scenario. Incident ID received from popup script: ", incidentId);

        openItsmNewTabAndStartSendingMessages(msg);
      }
    }
  });

  // Set the flag.
  startSearch = true;
});

// Listener for the context menus.
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  // User selected incident ID and wants to search the ITSM for it.
  if (info.menuItemId === "selected_text") {

    console.log("Background - Selection scenario");

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

    console.log("Background - Clipboard scenario");

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
