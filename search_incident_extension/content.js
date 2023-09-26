/******************************************************************************

Filename: content.js

Description:
Content script of browser extension. Automates searching incident in ITSM.

******************************************************************************/

console.log("Content - Content script executed on: ", document.title)

// Flag indicating whether searching for the incident started.
let searchStarted = false;

// Waits for HTML element to be visible.
function waitForElementToBeVisible(selector) {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) {
            observer.disconnect();
            resolve(element);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'hidden']
    });
  });
}

// Searches the ITSM for the incident. It replaces manual clicking.
function searchForTheIncident(incidentId) {

  // Click on "Search Incident" (wait untill it is visible). 
  const searchIncidentElementSelector = 'search incident element selector'
  const searchIncidentElement = document.querySelector(searchIncidentElementSelector);

  waitForElementToBeVisible(searchIncidentElementSelector).then((searchIncidentElement) => {
    console.log('Content - searchIncidentElement is now visible');
    searchIncidentElement.click();
  });

  // Insert incident ID into the textarea element (wait untill it is visible). 
  const textAreaElementSelector = 'text area element selector'
  const textAreaElement = document.querySelector(textAreaElementSelector);

  waitForElementToBeVisible(textAreaElementSelector).then((textAreaElement) => {
    console.log('Content - textAreaElement is now visible');

    // Insert incident ID into the textarea.
    textAreaElement.value = incidentId;

    // Double clicking the textbox (incident ID) makes searching possible - it trickts system that incident ID was typed by the user.
    // Without it, system does not recognize that ID was provided and refuses to continue.
    const clickEvent = document.createEvent('MouseEvents');
    clickEvent.initEvent('dblclick', true, true);
    textAreaElement.dispatchEvent(clickEvent);

    // Click "Search" button (wait untill it is visible). 
    const searchButtonSelector = 'search button selector';
    const searchButton = document.querySelector(searchButtonSelector);

    waitForElementToBeVisible(searchButtonSelector).then((searchButton) => {
      console.log('Content - searchButton is now visible');
      searchButton.click();
    });
  });
}

// Recives message from the background script.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Handle only those messages that are addressed to the content script. 
  if (message.destination === "content") {
    // If search already started, do not repeat it.
    if (!searchStarted) {
      // Check tab name.
      if (document.title == "BMC Remedy (Search)") {
        // Target page was reached.
        // Send message to the background script, so it will stop sending the messages.
        const msg = {
          source: "content",
          destination: "background",
          context: "search incident",
          targetPage: true
        };

        chrome.runtime.sendMessage(msg);

        let incidentId;

        // Depending on the message context, get the incident ID from the message or from the clipboard.
        if (message.context === "search incident – clipboard") {

          console.log("Content - Clipboard scenario in the content");

          // To avoid multiple searches, flag has to be set already here, before asking user for permissions,
          // not just before actual search start. Promise mechanism makes it tricky here. 
          searchStarted = true;

          // Wait for "Home" element to be visible. 
          // In clipboard use case, it will be later needed to click on "Home" element to force the script to continue.
          const homeElementSelector = 'home element selector'
          const homeElement = document.querySelector(homeElementSelector);

          waitForElementToBeVisible(homeElementSelector).then((homeElement) => {
            console.log('Content - homeElement is now visible');
            navigator.permissions.query({ name: 'clipboard-read' }).then(result => {
              // If permission to read the clipboard is granted or if the user will
              // be prompted to allow it, then proceed.
              if (result.state === 'granted' || result.state === 'prompt') {
                navigator.clipboard.readText()
                  .then(text => {
                    incidentId = text;

                    console.log("Content - Incident ID in the content script:", incidentId);

                    console.log("Content - Gained access to the clipboard. Started searching");


                    // Click on "Home" element. It is needed to force
                    // the script to continue.  
                    homeElement.click();
                    console.log("Content - 'Home' icon has been clicked")

                    // Search the ITSM for the incident.
                    searchForTheIncident(incidentId);
                  })
                  .catch(err => {
                    console.log("Content - Failed to read clipboard contents");
                  });
              }
            });
          });
        }
        else {
          console.log("Content - Selection or popup scenario");
          incidentId = message.incId;

          console.log("Content - Incident ID: ", incidentId);

          // Search the ITSM for the incident.
          searchStarted = true;
          searchForTheIncident(incidentId);
          console.log("Content - Search started")
        }
      }
      else {
        // Target page was not reached. Send message to the background script.
        const msg = {
          source: "content",
          destination: "background",
          context: "search incident",
          targetPage: false,
          docTitle: document.title
        };
        chrome.runtime.sendMessage(msg);
      }
    }
    else {
      console.log("Content - Search already started");
      // Resend message to the background script, so it will stop sending the messages.
      const msg = {
        source: "content",
        destination: "background",
        context: "search incident",
        targetPage: true
      };

      chrome.runtime.sendMessage(msg);
    }
  }
});


