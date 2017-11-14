window.addEventListener("__FENGARI_DEVTOOLS_RESULTS__", function (event) {
    chrome.extension.sendMessage({
        type: "__FENGARI_DEVTOOLS_RESULTS__",
        data: event.detail
    });
});
