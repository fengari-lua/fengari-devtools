window.addEventListener("__FENGARI_DEVTOOLS_RESULTS__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_RESULTS__",
        data: event.detail
    });
});

window.addEventListener("__FENGARI_DEVTOOLS_REGISTER__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_REGISTER__",
        data: event.detail
    });
});

window.addEventListener("__FENGARI_DEVTOOLS_DEBUG_START__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_DEBUG_START__",
        data: event.detail
    });
});

window.addEventListener("__FENGARI_DEVTOOLS_DEBUG_STOP__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_DEBUG_STOP__",
        data: event.detail
    });
});

window.addEventListener("__FENGARI_DEVTOOLS_DEBUG_STOP__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_DEBUG_STOP__",
        data: event.detail
    });
});
