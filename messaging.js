// This creates and maintains the communication channel between
// the inspectedPage and the dev tools panel.
//
// In this example, messages are JSON objects
// {
//   action: ['code'|'script'|'message'], // What action to perform on the inspected page
//   content: [String|Path to script|Object], // data to be passed through
//   tabId: [Automatically added]
// }

(function createChannel() {
    //Create a port with background page for continous message communication
    var port = chrome.extension.connect({
        name: "fengari" //Given a Name
    });

    // Listen to messages from the background page
    port.onMessage.addListener(function (message) {
        if (message.type === "__FENGARI_DEVTOOLS_RESULTS__")
            window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_RESULTS__", {
                detail: message.data
            }));
        else if (message.type === "__FENGARI_DEVTOOLS_REGISTER__")
            window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_REGISTER__", {
                detail: message.data
            }));
    });

}());

// This sends an object to the background page 
// where it can be relayed to the inspected page
function sendObjectToInspectedPage(action, content) {
    let message = {
        tabId: chrome.devtools.inspectedWindow.tabId,
        action: action,
        content: content
    };

    chrome.extension.sendMessage(message);
}
