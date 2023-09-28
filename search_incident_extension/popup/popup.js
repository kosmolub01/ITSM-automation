/******************************************************************************

Filename: popup.js

Description:
Popup script of browser extension. Automates searching incident in ITSM.

******************************************************************************/
/* POPUP USE CASE IS DISABLED
// Add event listeners.
document.addEventListener("DOMContentLoaded", function () {
    // Handle search button click event.
    document.getElementById("search-button").addEventListener("click", function () {
        // Retrieve what user typed.
        const incidentId = document.getElementById("incident-id-input").value;

        console.log("Popup - User clicked search button. Sending textbox content to the background script")

        // Send it to the background script.
        chrome.runtime.sendMessage({
            source: "popup",
            destination: "background",
            context: "search incident – popup",
            incId: incidentId
        });
    });

    // Handle pressing "Enter" key.
    document.getElementById("incident-id-input").addEventListener("keydown", function (event) {
        if (event.keyCode === 13) {
            // Prevent the default form submission.
            event.preventDefault(); 
            // Retrieve what user typed.
            const incidentId = document.getElementById("incident-id-input").value;

            console.log("Popup - User pressed enter key. Sending textbox content to the background script")

            // Send it to the background script.
            chrome.runtime.sendMessage({
                source: "popup",
                destination: "background",
                context: "search incident – popup",
                incId: incidentId
            });
        }
      });
});
*/