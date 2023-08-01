/******************************************************************************

Filename: background.js

Description:
Background script of browser extension. Automates searching incident in ITSM.

******************************************************************************/

// Used to stop sending periodically messages to the tab.
let intervalId;

// Send message to the specified tab and log it.
function sendMessage(tabID, message){
  chrome.tabs.sendMessage(tabID, message);
  console.log("Message was sent to the tab:", tabID)
}

// Open new tab of ITSM and start sending messages with incident ID to the newly created tab.
function openItsmNewTabAndStartSendingMessages(incidentId){
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

        // Start sending incident ID to the tab every 0.5 second.
        intervalId = setInterval(sendMessage, 500, targetTabId, {data: incidentId});
      }
    });
  });
}

// Done only once at install time.
chrome.runtime.onInstalled.addListener(() => {
    // Create context menu.
    chrome.contextMenus.create({
        id: "1",
        title: "Search the ITSM for \"%s\"", 
        contexts: ["selection"], 
    })

    // Listener for messages from content script (tab).
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "contentScriptMessage") {
        const targetPage = message.targetPage;
        console.log("'targetPage' flag received from content script:", targetPage);

        // If tab returned targetPage = true, it means the target page (ITSM) was reached and searching the incident has begun.
        if (targetPage) {
          // Stop sending incident ID to the tab.
          clearInterval(intervalId);
        }
      }
      else if (message.type === "popupScriptMessage"){
        const incidentId = message.incidentId;
        openItsmNewTabAndStartSendingMessages(incidentId);
      }
    });
});

// Listener for the context menu.
chrome.contextMenus.onClicked.addListener(function(info, tab){
    // Retrieve what user selected.
    const incidentId = info.selectionText;
    openItsmNewTabAndStartSendingMessages(incidentId);
})
