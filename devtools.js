// Can use
// chrome.devtools.*
// chrome.extension.*

// Create a tab in the devtools area
chrome.devtools.panels.create("Fengari", "toast.png", "panel.html", function(panel) {});

const registerDevtool = function () {
    window.__FENGARI_DEVTOOLS__ = function(fengari, interop, L) {

        const lua     = fengari.lua;
        const lauxlib = fengari.lauxlib;
        const lualib  = fengari.lualib;

        const msghandler = function(L) {
            let ar = new lua.lua_Debug();
            if (lua.lua_getstack(L, 2, ar))
                lua.lua_getinfo(L, lua.to_luastring("Sl"), ar);
            interop.push(L, new ErrorEvent("error", {
                bubbles: true,
                cancelable: true,
                message: lua.lua_tojsstring(L, 1),
                error: interop.tojs(L, 1),
                filename: ar.short_src ? lua.to_jsstring(ar.short_src) : void 0,
                lineno: ar.currentline > 0 ? ar.currentline : void 0
            }));
            return 1;
        };

        const run_lua_script = function(code) {
            let ok = lauxlib.luaL_loadbuffer(L, code, null, lua.to_luastring("devtool-line"));
            let e;
            if (ok === lua.LUA_ERRSYNTAX) {
                let msg = lua.lua_tojsstring(L, -1);
                let filename = document.location;
                let lineno = void 0; /* TODO: extract out of msg */
                let syntaxerror = new SyntaxError(msg, filename, lineno);
                e = new ErrorEvent("error", {
                    message: msg,
                    error: syntaxerror,
                    filename: filename,
                    lineno: lineno
                });
            } else if (ok === lua.LUA_OK) {
                /* insert message handler below function */
                let base = lua.lua_gettop(L);
                lua.lua_pushcfunction(L, msghandler);
                lua.lua_insert(L, base);
                /* set document.currentScript.
                   We can't set it normally; but we can create a getter for it, then remove the getter */
                // Object.defineProperty(document, 'currentScript', {
                //     value: tag,
                //     configurable: true
                // });
                let top = lua.lua_gettop(L);
                ok = lua.lua_pcall(L, 0, lua.LUA_MULTRET, base);
                let nresults = lua.lua_gettop(L) - top;

                console.warn(nresults + " results...");

                let results = []
                for (let i = nresults; i >= 0; i--) {
                    results.push(lua.to_jsstring(lauxlib.luaL_tolstring(L, -1)));
                    lua.lua_pop(L, 2);
                }

                window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_RESULTS__", {
                    detail: results.reverse()
                }));

                /* Remove the currentScript getter installed above; this restores normal behaviour */
                // delete document.currentScript;
                /* Remove message handler */
                lua.lua_remove(L, base);
                /* Check if normal error that msghandler would have handled */
                if (ok === lua.LUA_ERRRUN) {
                    e = interop.checkjs(L, -1);
                }
            }
            if (ok !== lua.LUA_OK) {
                if (e === void 0) {
                    e = new ErrorEvent("error", {
                        message: lua.lua_tojstring(L, -1),
                        error: interop.tojs(L, -1)
                    });
                }
                lua.lua_pop(L, 1);
                if (window.dispatchEvent(e)) {
                    console.error("uncaught exception", e.error);
                }
            }
        };

        window.addEventListener("__FENGARI_DEVTOOLS_EXECUTE__", function (event) {
            run_lua_script(lua.to_luastring(event.detail));
        })

    };

    window.dispatchEvent(new Event("__FENGARI_DEVTOOLS__"));
}

chrome.devtools.inspectedWindow.eval(`(${registerDevtool.toString()})()`);
