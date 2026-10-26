/*
 * Framework-neutral JS9 viewer custom element.
 * Load JS9 browser assets before this file, then use <js9-viewer> in any UI framework.
 */
"use strict";

class JS9ViewerElement extends HTMLElement {
    static get observedAttributes(){
        return ["colorbar", "display-id", "height", "menubar", "src", "statusbar", "toolbar", "width"];
    }

    constructor(){
        super();
        this.initialized = false;
        this.generatedId = `js9-element-${JS9ViewerElement.nextId++}`;
        this.lastSource = null;
        this.loading = false;
        this.onJS9Error = (event, detail = {}) => {
            if( this.loading ){
                event.preventDefault();
                this.reportError(detail.error || new Error(detail.message || "JS9 could not load the image."));
            }
        };
    }

    get displayId(){ return this.getAttribute("display-id") || this.generatedId; }
    get width(){ return Number(this.getAttribute("width")) || 640; }
    get height(){ return Number(this.getAttribute("height")) || 480; }
    get enabledMenubar(){ return this.getAttribute("menubar") !== "false"; }
    get enabledToolbar(){ return this.getAttribute("toolbar") !== "false"; }
    get enabledColorbar(){ return this.getAttribute("colorbar") !== "false"; }
    get enabledStatusbar(){ return this.getAttribute("statusbar") !== "false"; }
    get source(){ return this.getAttribute("src"); }

    emit(name, detail = {}){
        this.dispatchEvent(new CustomEvent(`js9-${name}`, {bubbles: true, detail}));
    }

    setStatus(state, detail = {}){
        const messages = {initializing: "Initializing JS9…", ready: "Viewer ready", loading: "Loading image…", loaded: "Image loaded", error: "Unable to load JS9 or image"};
        const feedback = this.querySelector(".js9-viewer-feedback");
        if( feedback ){
            feedback.textContent = messages[state] || "";
            feedback.dataset.state = state;
        }
        this.setAttribute("data-state", state);
        this.emit("status", {state, ...detail});
    }

    reportError(error){
        this.loading = false;
        this.setStatus("error", {error});
        const detail = this.querySelector(".js9-viewer-error-detail");
        const retry = this.querySelector(".js9-viewer-retry");
        if( detail ){
            detail.textContent = error?.message || "Unable to load the image. Check its URL, network access, and CORS configuration.";
        }
        if( retry ){
            retry.hidden = !this.lastSource;
        }
        const panel = this.querySelector(".js9-viewer-error");
        if( panel ){
            panel.hidden = false;
        }
        this.emit("error", {error});
    }

    requireJS9(){
        if( !window.JS9 || typeof window.JS9.AddDivs !== "function" ){
            const error = new Error("JS9 is not loaded. Load js9support, js9, and js9plugins before js9-viewer-element.js.");
            this.setStatus("error", {error});
            this.emit("error", {error});
            throw error;
        }
        return window.JS9;
    }

    render(){
        this.replaceChildren();
        const chrome = document.createElement("div");
        chrome.className = "js9-viewer-chrome";
        const makePlugin = (className) => {
            const element = document.createElement("div");
            element.className = className;
            element.dataset.js9id = this.displayId;
            return element;
        };
        const menubar = makePlugin("JS9Menubar");
        menubar.hidden = !this.enabledMenubar;
        chrome.append(menubar);
        const toolbar = makePlugin("JS9Toolbar");
        toolbar.hidden = !this.enabledToolbar;
        chrome.append(toolbar);
        this.append(chrome);
        const canvas = document.createElement("div");
        canvas.id = this.displayId;
        canvas.className = "JS9";
        canvas.dataset.width = String(this.width);
        canvas.dataset.height = String(this.height);
        this.append(canvas);
        const colorbar = document.createElement("div");
        colorbar.className = "js9-viewer-colorbar";
        colorbar.hidden = !this.enabledColorbar;
        colorbar.append(makePlugin("JS9Colorbar"));
        this.append(colorbar);
        const status = document.createElement("div");
        status.className = "js9-viewer-status";
        status.hidden = !this.enabledStatusbar;
        status.append(makePlugin("JS9Statusbar"));
        this.append(status);
        const feedback = document.createElement("p");
        feedback.className = "js9-viewer-feedback";
        feedback.setAttribute("role", "status");
        this.append(feedback);
        const errorPanel = document.createElement("div");
        errorPanel.className = "js9-viewer-error";
        errorPanel.hidden = true;
        const detail = document.createElement("p");
        detail.className = "js9-viewer-error-detail";
        errorPanel.append(detail);
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "js9-viewer-retry";
        retry.textContent = "Retry";
        retry.hidden = true;
        retry.addEventListener("click", () => this.retry());
        errorPanel.append(retry);
        this.append(errorPanel);
    }

    connectedCallback(){
        if( this.initialized ){
            return;
        }
        this.render();
        this.setStatus("initializing");
        const initialize = () => {
            if( !this.isConnected || this.initialized ){
                return;
            }
            try {
            const js9 = this.requireJS9();
            js9.AddDivs(this.displayId);
            window.jQuery(document).on("JS9:error", this.onJS9Error);
            this.initialized = true;
            this.setStatus("ready", {id: this.displayId});
            this.emit("ready", {id: this.displayId, display: js9.lookupDisplay(this.displayId)});
            if( this.source ){
                this.load(this.source);
            }
            } catch(ignore) { /* error event and status were already emitted */ }
        };
        if( window.JS9 && window.JS9.readied ){
            initialize();
        } else if( window.jQuery ){
            window.jQuery(document).one("JS9:ready", initialize);
        } else {
            window.setTimeout(initialize, 0);
        }
    }

    disconnectedCallback(){
        if( window.jQuery ){
            window.jQuery(document).off("JS9:error", this.onJS9Error);
        }
        if( this.initialized && window.JS9 ){
            window.JS9.CloseDisplay(this.displayId);
        }
        this.initialized = false;
    }

    attributeChangedCallback(name, oldValue, value){
        if( !this.initialized || oldValue === value ){
            return;
        }
        if( name === "src" && value ){
            this.load(value);
        } else if( name === "width" || name === "height" ){
            this.resize();
        } else if( name === "menubar" || name === "toolbar" || name === "colorbar" || name === "statusbar" ){
            const map = {menubar: ".JS9Menubar", toolbar: ".JS9Toolbar", colorbar: ".js9-viewer-colorbar", statusbar: ".js9-viewer-status"};
            const element = this.querySelector(map[name]);
            if( element ){
                element.hidden = (name === "menubar" && !this.enabledMenubar) ||
                    (name === "toolbar" && !this.enabledToolbar) ||
                    (name === "colorbar" && !this.enabledColorbar) ||
                    (name === "statusbar" && !this.enabledStatusbar);
            }
        }
    }

    load(source = this.source, options = {}){
        if( !source ){
            this.reportError(new Error("Provide a FITS image URL first."));
            return null;
        }
        try {
            const js9 = this.requireJS9();
            this.lastSource = source;
            this.loading = true;
            const panel = this.querySelector(".js9-viewer-error");
            if( panel ){
                panel.hidden = true;
            }
            this.setStatus("loading", {source});
            return js9.Load(source, {...options, onload: (image) => {
                if( typeof options.onload === "function" ){
                    options.onload(image);
                }
                this.loading = false;
                const panel = this.querySelector(".js9-viewer-error");
                if( panel ){
                    panel.hidden = true;
                }
                this.setStatus("loaded", {image});
                this.emit("load", {image});
            }}, {display: this.displayId});
        } catch(error) {
            this.reportError(error);
            return null;
        }
    }

    retry(){ return this.lastSource ? this.load(this.lastSource) : null; }
    loadFullImage(){ return this.requireJS9().DisplaySection("full", {display: this.displayId}); }
    zoomToFit(){ return this.requireJS9().SetZoom("toFit", {display: this.displayId}); }
    resize(width = this.width, height = this.height){ return this.requireJS9().ResizeDisplay(width, height, {display: this.displayId}); }
    getImage(){ return this.requireJS9().GetImage({display: this.displayId}); }
}

JS9ViewerElement.nextId = 1;
customElements.define("js9-viewer", JS9ViewerElement);
