// Can use
// chrome.devtools.*
// chrome.extension.*

// Create a tab in the devtools area
chrome.devtools.panels.create("Fengari", "toast.png", "panel.html", function(panel) {});

let debugging = false;

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    console.log(message);
    if (message.type) {
        if (message.type === "__FENGARI_DEVTOOLS_DEBUG_START__") {
            debugging = true;
        }

        if (message.type === "__FENGARI_DEVTOOLS_DEBUG_STOP__") {
            debugging = false;
        }
    }

    if (message.content && message.content.type
        && message.content.type === "__FENGARI_DEVTOOLS_EXECUTE__" && debugging) {
        chrome.devtools.inspectedWindow.eval("window.__FENGARI_DEVTOOLS_RUN__(`" + message.content.code + "`);");
    }
});
