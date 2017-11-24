// Can use
// chrome.devtools.*
// chrome.extension.*

// Create a tab in the devtools area
chrome.devtools.panels.create("Fengari", "toast.png", "panel.html", function(panel) {});

let debugging = false;

let debuggee = {
    tabId: chrome.devtools.inspectedWindow.tabId
};

// Enable debugging
console.warn(`Attaching debugger to ${chrome.devtools.inspectedWindow.tabId}`);
chrome.debugger.attach(debuggee, "1.2");
chrome.debugger.sendCommand(debuggee, "Debugger.enable");

chrome.devtools.inspectedWindow.getResources(function (resources) {
    resources.forEach(function (resource) {
        resource.getContent(function(content, encoding) {
            if (!encoding) {
                chrome.devtools.inspectedWindow.eval(
                    "window.__FENGARI_DEVTOOLS_REGISTER_RESOURCE__(`" + resource.url + "`, `" + content + "`);"
                );
            }
        });
    });
});

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "__FENGARI_DEVTOOLS_DEBUG_START__") {
        debugging = true;
        // chrome.debugger.sendCommand(debuggee, "Debugger.pause");
    }

    else if (message.content && message.content.type
        && message.content.type === "__FENGARI_DEVTOOLS_DEBUG_STOP__") {
        debugging = false;

        chrome.debugger.sendCommand(debuggee, "Debugger.resume");
    }

    else if (message.content && message.content.type
        && message.content.type === "__FENGARI_DEVTOOLS_EXECUTE__" && debugging) {
        chrome.devtools.inspectedWindow.eval("window.__FENGARI_DEVTOOLS_RUN__(`" + message.content.code + "`);");
    }
});
