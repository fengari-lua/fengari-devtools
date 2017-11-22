local js = require "js"

-- Save references to lua baselib functions used
local _G = _G
local pack, unpack = table.pack, table.unpack
local tostring = tostring

local window = js.global
local document = window.document
local console = window.console
local hljs = js.global.hljs

window:sendObjectToInspectedPage("script", "injected.js")

local output = document:getElementById("fengari-console")
local prompt = document:getElementById("fengari-prompt")
local input = document:getElementById("fengari-input")
local state = document:getElementById("state")
local debuggerPauseResume = document:getElementById("debugger-pause-resume")
local debuggerStepInto = document:getElementById("debugger-step-into")
local debuggerStepOut = document:getElementById("debugger-step-out")
local debuggerStepOver = document:getElementById("debugger-step-over")
assert(output and prompt and input)

local function triggerEvent(el, type)
    local e = document:createEvent("HTMLEvents")
    e:initEvent(type, false, true)
    el:dispatchEvent(e)
end

local history = {}
local historyIndex = nil
local historyLimit = 100

local debugging = false

local function executeOnInspectedPage(code)
    if (not debugging) then
        window:sendObjectToInspectedPage("code",
            [[
                window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_EXECUTE__", {
                    detail: {
                        stateId: ]] .. state.value .. [[,
                        code: `]] .. code .. [[`
                    }
                }))
            ]]
        );
    else
        local codeMessage = js.new(window.Object)
        codeMessage.code = code
        codeMessage.type = "__FENGARI_DEVTOOLS_EXECUTE__"
        window:sendObjectToInspectedPage("panel", codeMessage)
    end
end

local function registerState(stateId, stateName)
    local option = document:createElement("option")
    option.value = stateId
    option.textContent = "State #" .. math.floor(stateId) .. ": " .. stateName
    state:appendChild(option)

    state.value = stateId

    executeOnInspectedPage([[
        do
            local gprint = _G.print
            local window = js.global

            -- Override _G.print to capture its output
            _G.print = function(...)
                gprint(...)

                local eventData = js.new(window.Object)
                eventData.detail = js.new(window.Object)
                eventData.detail.stateId = _G.__FENGARI_DEVTOOLS_STATE__
                eventData.detail.results = window:Array()
                for i, e in ipairs(table.pack(...)) do
                    eventData.detail.results:push(tostring(e))
                end

                local event = js.new(window.CustomEvent, "__FENGARI_DEVTOOLS_RESULTS__", eventData)

                window:dispatchEvent(event);
            end

            -- debug.sethook(function(event, line)
            --     print(event, line)
            --
            --     local ar = debug.getinfo(2, "nSl")
            --
            --     for k,v in pairs(ar) do
            --         print(k,v)
            --     end
            -- end, "l")
        end
    ]])
end

_G.print = function(...)
    local toprint = pack(...)

    local line = document:createElement("pre")
    line.style["white-space"] = "pre-wrap"
    output:appendChild(line)

    for i = 1, toprint.n do
        if i ~= 1 then
            line:appendChild(document:createTextNode("\t"))
        end
        line:appendChild(document:createTextNode(tostring(toprint[i])))
    end

    output.scrollTop = output.scrollHeight
end

local function clear()
    output.innerHTML = ""
    _G.print(_G._COPYRIGHT)
end

window:addEventListener("__FENGARI_DEVTOOLS_RESULTS__", function (_, event)
    if (tonumber(event.detail.stateId) == tonumber(state.value)) then
        local results = event.detail.results

        local toprint = {}
        for result in js.of(results) do
            table.insert(toprint, result)
        end

        _G.print(unpack(toprint))
    end
end)

window:addEventListener("__FENGARI_DEVTOOLS_REGISTER__", function (_, event)
    registerState(event.detail.stateId, event.detail.stateName)
end)

window:addEventListener("__FENGARI_DEVTOOLS_DEBUG_START__", function (_, event)
    debugging = true
end)

window:addEventListener("__FENGARI_DEVTOOLS_DEBUG_STOP__", function (_, event)
    console:warn(event)
    debugging = false
end)

debuggerPauseResume:addEventListener("click", function()
    if (debugging) then
        debugging = false
        local codeMessage = js.new(window.Object)
        codeMessage.type = "__FENGARI_DEVTOOLS_DEBUG_STOP__"
        window:sendObjectToInspectedPage("panel", codeMessage)
    else
        debugging = true
        window:sendObjectToInspectedPage("code", [[
            window.dispatchEvent(new Event("__FENGARI_DEVTOOLS_DEBUG_START__"))
        ]])
    end
end)

debuggerStepInto:addEventListener("click", function()

end)

debuggerStepOut:addEventListener("click", function()

end)

debuggerStepOver:addEventListener("click", function()

end)


state:addEventListener("change", function()
    clear()
end)

local function doREPL()
    do
        local line = document:createElement("span")
        line:appendChild(document:createTextNode(prompt.textContent))
        local item = document:createElement("pre")
        item.className = "lua"
        item.style.padding = "0"
        item.style.display = "inline"
        item.style["white-space"] = "pre-wrap"
        item.textContent = input.value
        hljs:highlightBlock(item)
        line:appendChild(item)
        output:appendChild(line)
        output:appendChild(document:createElement("br"))
        output.scrollTop = output.scrollHeight
    end

    if input.value.length == 0 then
        return
    end

    local line = input.value
    if history[#history] ~= line then
        table.insert(history, line)
        if #history > historyLimit then
            table.remove(history, 1)
        end
    end

    executeOnInspectedPage(line)

    input.value = ""

    triggerEvent(output, "change")
end

function input:onkeydown(e)
    if not e then
        e = js.global.event
    end

    local key = e.key or e.which
    if key == "Enter" and not e.shiftKey then
        historyIndex = nil
        doREPL()
        return false
    elseif key == "ArrowUp" then
        if historyIndex then
            if historyIndex > 1 then
                historyIndex = historyIndex - 1
            end
        else -- start with more recent history item
            local hist_len = #history
            if hist_len > 0 then
                historyIndex = hist_len
            end
        end
        input.value = history[historyIndex]
        return false
    elseif key == "ArrowDown" then
        local newvalue = ""
        if historyIndex then
            if historyIndex < #history then
                historyIndex = historyIndex + 1
                newvalue = history[historyIndex]
            else -- no longer in history
                historyIndex = nil
            end
        end
        input.value = newvalue
        return false
    elseif key == "l"
        and e.ctrlKey
        and not e.shiftKey
        and not e.altKey
        and not e.metaKey
        and not e.isComposing then
        -- Ctrl+L clears screen like you would expect in a terminal
        clear()
        return false
    end
end

clear()

-- Ask for active states to register
window:sendObjectToInspectedPage("code",
    [[
        window.dispatchEvent(new CustomEvent("__FENGARI_DEVTOOLS_STATES__"))
    ]]
);
