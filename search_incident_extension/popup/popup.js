// Add event listeners.
document.addEventListener("DOMContentLoaded", function () {
    // Handle search button click event.
    document.getElementById("search-button").addEventListener("click", function () {
        // Retrieve what user typed.
        const incidentId = document.getElementById("incident-id-input").value;
        // Send it to the background script.
        chrome.runtime.sendMessage({type: "popupScriptMessage",
                                    incId: incidentId});
    });
});
