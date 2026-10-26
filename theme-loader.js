/* Apply a JS9MuV1 interface theme from JSON after JS9 has initialized. */
(function(){
    "use strict";
    const script = document.currentScript;
    const source = script?.dataset.theme || "theme.json";
    const display = script?.dataset.display || "JS9";
    const maxAttempts = 100;
    const delay = 50;

    async function readTheme(){
        const response = await fetch(source, {cache: "no-cache"});
        if( !response.ok ){
            throw new Error(`could not load theme (${response.status})`);
        }
        return response.json();
    }

    function applyWhenReady(options, attempt){
        if( window.JS9 && typeof window.JS9.SetInterface === "function" ){
            try{
                window.JS9.SetInterface(options, {display});
                window.dispatchEvent(new CustomEvent("js9-theme-ready", {detail: {display, options}}));
            } catch(error){
                window.dispatchEvent(new CustomEvent("js9-theme-error", {detail: {display, error}}));
            }
            return;
        }
        if( attempt < maxAttempts ){
            window.setTimeout(() => applyWhenReady(options, attempt + 1), delay);
        } else {
            window.dispatchEvent(new CustomEvent("js9-theme-error", {detail: {display, error: new Error("JS9 did not initialize")}}));
        }
    }

    readTheme().then((options) => applyWhenReady(options, 0)).catch((error) => {
        window.dispatchEvent(new CustomEvent("js9-theme-error", {detail: {display, error}}));
    });
}());
