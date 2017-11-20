window.addEventListener("__FENGARI_DEVTOOLS_RESULTS__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_RESULTS__",
        data: event.detail
    });
});

window.addEventListener("__FENGARI_DEVTOOLS_ERROR__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_ERROR__",
        data: event.detail
    });
});

window.addEventListener("__FENGARI_DEVTOOLS_REGISTER__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_REGISTER__",
        data: event.detail
    });
});
