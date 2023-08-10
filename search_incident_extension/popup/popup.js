/******************************************************************************

Filename: popup.js

Description:
Popup script of browser extension. Automates searching incident in ITSM.

******************************************************************************/

// Add event listeners.
document.addEventListener("DOMContentLoaded", function () {
    // Handle search button click event.
    document.getElementById("search-button").addEventListener("click", function () {
        // Retrieve what user typed.
        const incidentId = document.getElementById("incident-id-input").value;

        console.log("in popup")

        // Send it to the background script.
        chrome.runtime.sendMessage({
            source: "popup",
            destination: "background",
            context: "search incident – popup",
            incId: incidentId
        });
    });
});
