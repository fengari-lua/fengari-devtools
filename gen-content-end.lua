local f = io.open("node_modules/fengari-web/dist/fengari-web.js", "r")
local fengariWeb = f:read("*all"):gsub("`", ""):gsub("\\","\\\\")
f:close()

f = io.open("content-end.js", "w")
f:write([[
    (function () {
        let script = document.createElement('script');
        script.textContent = `
            window.__FENGARI_STATE_NAME__ = "devtools";
            ]] .. fengariWeb .. [[
        `;
        document.documentElement.appendChild(script);
        script.parentNode.removeChild(script);
    })()
]])
f:close()

