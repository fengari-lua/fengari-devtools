const registerDevtool = function () {
    if (!window.__FENGARI_DEVTOOLS__) {
        window.__FENGARI_DEVTOOLS_STATES__ = [];

        const registerState = function(id, name) {
            window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_REGISTER__", {
                detail: {
                    stateId: id,
                    stateName: name ? name : document.location.href
                }
            }));
        };

        window.addEventListener("__FENGARI_DEVTOOLS_STATES__", function() {
            for (let i = 0; i < window.__FENGARI_DEVTOOLS_STATES__.length; i++) {
                console.warn("__FENGARI_DEVTOOLS_STATES__", i, window.__FENGARI_DEVTOOLS_STATES__[i]);
                registerState(i, window.__FENGARI_DEVTOOLS_STATES__[i]);
            }
        });

        window.__FENGARI_DEVTOOLS__ = function(fengari, interop, L, name) {
            console.warn(name);

            const lua     = fengari.lua;
            const lauxlib = fengari.lauxlib;
            const lualib  = fengari.lualib;

            window.__FENGARI_DEVTOOLS_STATES__.push(name ? name : document.location.href);

            const currentState = window.__FENGARI_DEVTOOLS_STATES__.length - 1;

            lua.lua_pushinteger(L, currentState);
            lua.lua_setglobal(L, lua.to_luastring("__FENGARI_DEVTOOLS_STATE__"));

            console.warn("__FENGARI_DEVTOOLS_REGISTER__", currentState);
            registerState(currentState, window.__FENGARI_DEVTOOLS_STATES__[currentState]);


            // A debug.debug like function that will wait for inputs from devtools
            const breakpoint = function() {
                window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_RESULTS__", {
                    detail: {
                        stateId: currentState,
                        results: ["Stopped for debug..."]
                    }
                }));

                window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_DEBUG_START__", {
                    detail: {
                        stateId: currentState
                    }
                }));

                run_lua_script(`do
                        local window = js.global

                        local info = debug.getinfo(3)
                        local source = info.source

                        local event = js.new(window.Object)
                        event.detail = js.new(window.Object)
                        event.detail.stateId = ${currentState}
                        event.detail.source = source

                        window.console:warn(event)

                        window:dispatchEvent(js.new(window.CustomEvent, "__FENGARI_DEVTOOLS_DEBUG_RESOURCE__", event))
                    end
                `);

                debugger;

                return 0;
            };

            // Set debug.debug to breakpoint function
            lua.lua_getglobal(L, lua.to_luastring("debug"));
            lua.lua_pushstring(L, lua.to_luastring("debug"));
            lua.lua_pushcclosure(L, breakpoint, 0);
            lua.lua_settable(L, -3);
            lua.lua_pop(L, 1);

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
                let ok = lauxlib.luaL_loadbuffer(L, lua.to_luastring("return " + code), null, lua.to_luastring("devtool-line"));
                if (ok !== lua.LUA_OK)
                    ok = lauxlib.luaL_loadbuffer(L, lua.to_luastring(code), null, lua.to_luastring("devtool-line"));

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

                    let results = [];
                    for (let i = nresults; i >= 0; i--) {
                        results.push(lua.to_jsstring(lauxlib.luaL_tolstring(L, -1)));
                        lua.lua_pop(L, 2);
                    }

                    window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_RESULTS__", {
                        detail: {
                            stateId: currentState,
                            results: results.reverse()
                        }
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

            const registerResource = function(url, content) {
                window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_REGISTER_RESOURCE__", {
                        detail: {
                            stateId: currentState,
                            url: url,
                            content: content
                        }
                    }));
            };

            window.__FENGARI_DEVTOOLS_RUN__ = run_lua_script;

            window.__FENGARI_DEVTOOLS_REGISTER_RESOURCE__ = registerResource;

            window.addEventListener("__FENGARI_DEVTOOLS_EXECUTE__", function (event) {
                if (event.detail.stateId === currentState)
                    run_lua_script(event.detail.code);
            });

        };
    }
};

var script = document.createElement('script');
script.textContent = `(${registerDevtool.toString()})()`;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);
