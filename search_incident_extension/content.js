/******************************************************************************

Filename: content.js

Description:
Content script of browser extension. Automates searching incident in ITSM.

******************************************************************************/

console.log("Content script executed on:", document.title)

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
function searchForTheIncident(incidentId){
  // Click on "Search Incident" (wait untill it is visible). 
  const searchIncidentElementSelector = 'search incident element selector';
  const searchIncidentElement = document.querySelector(searchIncidentElementSelector);

  waitForElementToBeVisible(searchIncidentElementSelector).then((searchIncidentElement) => {
      console.log('searchIncidentElement is now visible:', searchIncidentElement);
      searchIncidentElement.click();
  });

  // Insert incident ID into the textarea element (wait untill it is visible). 
  const textAreaElementSelector = 'text area element selector';
  const textAreaElement = document.querySelector(textAreaElementSelector);

  waitForElementToBeVisible(textAreaElementSelector).then((textAreaElement) => {
      console.log('textAreaElement is now visible:', textAreaElement);

      // Insert incident ID into the textarea.
      textAreaElement.value = incidentId;

      // Double clicking the textbox (incident ID) makes searching possible - it trickts system that incident ID was typed by the user.
      // Without it, system does not recognize that ID was provided and refuses to continue.
      const clickEvent  = document.createEvent ('MouseEvents');
      clickEvent.initEvent ('dblclick', true, true);
      textAreaElement.dispatchEvent (clickEvent);

      // Click "Search" button (wait untill it is visible). 
      const searchButtonSelector = 'search button selector';
      const searchButton = document.querySelector(searchButtonSelector);

      waitForElementToBeVisible(searchButtonSelector).then((searchButton) => {
          console.log('searchButton is now visible:', searchButton);
          searchButton.click();
      });
  });
}

// Recives incident ID from background.js and checks whether it can start 
// searching for that incident.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // If search already started, do not repeat it.
  if(!searchStarted)
  {
    // Access the incident ID passed from the background script.
    const incidentId = message.incId;

    console.log("Received data in content script:", incidentId);

    // Check tab name.
    if(document.title == "BMC Remedy (Search)"){
      // Target page was reached.
      // Send message to the background script, so it will stop sending the messages with incident ID.
      chrome.runtime.sendMessage({
        type: "contentScriptMessage",
        targetPage: true,
      });

      // Search the ITSM for the incident.
      searchStarted = true;
      searchForTheIncident(incidentId);
      console.log("Search started")
      
    }
    else{
      // Target page was not reached. Send message to the background script.
      chrome.runtime.sendMessage({
        type: "contentScriptMessage",
        targetPage: false,
        docTitle: document.title
      });
    }
  }
  else{
    console.log("Search already started")
  }   
});


