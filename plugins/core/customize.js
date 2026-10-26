/* per-display interface customizer */
/*global $, JS9 */
"use strict";

JS9.Customize = {};
JS9.Customize.CLASS = "JS9";
JS9.Customize.NAME = "Customize";
JS9.Customize.WIDTH = 440;
JS9.Customize.HEIGHT = 660;
JS9.Customize.STORAGE_PREFIX = "JS9:interface:";
JS9.Customize.defaults = {theme: "light", accent: "#2563eb", density: "standard", minimal: false, menubar: true, toolbar: true, statusbar: true, menuBackground: "#e2e8f0", menuText: "#1e293b", menuFontSize: 13, toolbarTools: null, uiTokens: {}, uiClass: "", components: {}};
JS9.Customize.tokenNames = {background: "--js9-ui-bg", surface: "--js9-ui-surface", control: "--js9-ui-control", text: "--js9-ui-text", muted: "--js9-ui-muted", border: "--js9-ui-border", accent: "--js9-accent", accentText: "--js9-accent-contrast", menuBackground: "--js9-menu-background", menuButtonBackground: "--js9-menu-button-background", toolbarBackground: "--js9-toolbar-background", statusBackground: "--js9-status-background", formBackground: "--js9-form-background", buttonBackground: "--js9-button-background", buttonHoverBackground: "--js9-button-hover-background", menuText: "--js9-menu-text", toolbarText: "--js9-toolbar-text", statusText: "--js9-status-text", formText: "--js9-form-text", titleBackground: "--js9-window-title-bg", titleText: "--js9-window-title-text", radius: "--js9-ui-radius", fontFamily: "--js9-ui-font"};
JS9.Customize.componentNames = ["menu", "toolbar", "status", "window", "form"];
JS9.Customize.componentFields = ["background", "textColor", "fontFamily", "fontSize", "height", "padding", "radius", "borderColor"];

JS9.Customize.defaultToolbarTools = function(){
    const primary = JS9.globalOpts.toolBar || [];
    const names = JS9.Toolbar.tools.map((tool) => tool.name).filter((name) => name !== "circle");
    return primary.concat(names.filter((name) => primary.indexOf(name) < 0));
};
JS9.Customize.normalizeToolbarTools = function(tools){
    const known = JS9.Toolbar.tools.map((tool) => tool.name).filter((name) => name !== "circle");
    const selected = Array.isArray(tools) ? tools : JS9.Customize.defaultToolbarTools();
    return selected.filter((name, index) => known.indexOf(name) >= 0 && selected.indexOf(name) === index);
};

JS9.Customize.storageKey = function(display){ return `${JS9.Customize.STORAGE_PREFIX}${display.id}`; };
JS9.Customize.rgb = function(hex){
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
JS9.Customize.luminance = function(hex){
    return JS9.Customize.rgb(hex).map((value) => {
	value /= 255;
	return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
};
JS9.Customize.contrast = function(a, b){
    const la = JS9.Customize.luminance(a);
    const lb = JS9.Customize.luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
JS9.Customize.readableText = function(background, requested){
    if( JS9.Customize.contrast(background, requested) >= 4.5 ){
	return requested;
    }
    return JS9.Customize.contrast(background, "#ffffff") >= JS9.Customize.contrast(background, "#0f172a") ? "#ffffff" : "#0f172a";
};
JS9.Customize.read = function(display){
    let value;
    try{ value = localStorage.getItem(JS9.Customize.storageKey(display)); }
    catch(ignore){ /* localStorage is optional */ }
    if( value ){
        try{ return $.extend({}, JS9.Customize.defaults, JSON.parse(value)); }
        catch(ignore){ /* use defaults */ }
    }
    return $.extend({}, JS9.Customize.defaults);
};
JS9.Customize.write = function(display, opts){
    try{ localStorage.setItem(JS9.Customize.storageKey(display), JSON.stringify(opts)); }
    catch(ignore){ /* localStorage is optional */ }
};
JS9.Customize.chrome = function(display){
    const id = display.id;
    return $(`#${id}, #${id}Menubar, #${id}Toolbar, #${id}Statusbar`).add($(`[data-js9id="${id}"]`));
};
JS9.Customize.normalizeTokens = function(tokens){
    const out = {};
    if( !tokens || typeof tokens !== "object" ){ return out; }
    Object.keys(JS9.Customize.tokenNames).forEach((key) => {
	const value = tokens[key];
	if( typeof value === "string" && value.length <= 120 && !/[;{}<>]/.test(value) ){
	    out[key] = value.trim();
	}
    });
    return out;
};
JS9.Customize.applyTokens = function(display, opts){
    const tokens = JS9.Customize.normalizeTokens(opts.uiTokens);
    const css = {};
    const targets = JS9.Customize.chrome(display).add(document.documentElement);
    targets.each(function(){
	Object.keys(JS9.Customize.tokenNames).forEach((key) => this.style.removeProperty(JS9.Customize.tokenNames[key]));
    });
    Object.keys(tokens).forEach((key) => { css[JS9.Customize.tokenNames[key]] = tokens[key]; });
    targets.css(css);
    opts.uiTokens = tokens;
    opts.uiClass = typeof opts.uiClass === "string" && /^[A-Za-z0-9_-]{0,48}$/.test(opts.uiClass) ? opts.uiClass : "";
    $(document.documentElement).attr({"data-js9-ui-custom": Object.keys(tokens).length ? "true" : "false", "data-js9-ui-class": opts.uiClass});
};
JS9.Customize.normalizeComponents = function(components){
    const out = {};
    if( !components || typeof components !== "object" ){ return out; }
    JS9.Customize.componentNames.forEach((name) => {
	const component = components[name];
	if( !component || typeof component !== "object" ){ return; }
	out[name] = {};
	JS9.Customize.componentFields.forEach((field) => {
	    const value = component[field];
	    if( typeof value === "string" && value.length <= 120 && !/[;{}<>]/.test(value) ){
		out[name][field] = value.trim();
	    }
	});
	if( !Object.keys(out[name]).length ){ delete out[name]; }
    });
    return out;
};
JS9.Customize.applyComponents = function(display, opts, extra){
    const components = JS9.Customize.normalizeComponents(opts.components);
    const css = {};
    const targets = extra ? $(extra) : JS9.Customize.chrome(display).add(document.documentElement);
    targets.each(function(){
	JS9.Customize.componentNames.forEach((name) => JS9.Customize.componentFields.forEach((field) => this.style.removeProperty(`--js9-${name}-${field.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`)));
    });
    Object.keys(components).forEach((name) => Object.keys(components[name]).forEach((field) => { css[`--js9-${name}-${field.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = components[name][field]; }));
    targets.css(css);
    opts.components = components;
};
JS9.Customize.applyFloatingWindow = function(display, windowId){
    const opts = JS9.Customize.read(display);
    const tokens = JS9.Customize.normalizeTokens(opts.uiTokens);
    const win = $(`#${windowId}`);
    const css = {};
    if( !win.length ){ return; }
    Object.keys(tokens).forEach((key) => { css[JS9.Customize.tokenNames[key]] = tokens[key]; });
    win.attr({"data-js9-display": display.id, "data-js9-ui-custom": Object.keys(tokens).length ? "true" : "false", "data-js9-theme": opts.theme, "data-js9-density": opts.density, "data-js9-ui-class": opts.uiClass}).css(css);
    JS9.Customize.applyComponents(display, opts, win);
};
JS9.Customize.apply = function(display, requested){
    const opts = $.extend({}, JS9.Customize.read(display), requested || {});
    if( !/^#[0-9a-f]{6}$/i.test(opts.accent) ){ opts.accent = JS9.Customize.defaults.accent; }
    if( !/^#[0-9a-f]{6}$/i.test(opts.menuBackground) ){ opts.menuBackground = JS9.Customize.defaults.menuBackground; }
    if( !/^#[0-9a-f]{6}$/i.test(opts.menuText) ){ opts.menuText = JS9.Customize.defaults.menuText; }
    // Never persist unreadable user-selected foreground/background pairs.
    opts.menuText = JS9.Customize.readableText(opts.menuBackground, opts.menuText);
    opts.menuFontSize = Math.max(11, Math.min(20, parseInt(opts.menuFontSize, 10) || JS9.Customize.defaults.menuFontSize));
    opts.toolbarTools = JS9.Customize.normalizeToolbarTools(opts.toolbarTools);
    if( ["light", "dark", "midnight", "contrast"].indexOf(opts.theme) < 0 ){ opts.theme = JS9.Customize.defaults.theme; }
    if( ["standard", "compact"].indexOf(opts.density) < 0 ){ opts.density = JS9.Customize.defaults.density; }
    opts.minimal = opts.minimal === true || opts.minimal === "true";
    JS9.Customize.chrome(display).attr({"data-js9-theme": opts.theme, "data-js9-density": opts.density, "data-js9-minimal": opts.minimal ? "true" : "false"}).css({"--js9-accent": opts.accent, "--js9-accent-contrast": JS9.Customize.readableText(opts.accent, "#ffffff")});
    // Context menus and floating plugin windows are appended outside a display.
    // Mirror the active display theme on the document root so that this second
    // level of UI uses the same palette as the viewer chrome.
    $(document.documentElement)
        .attr("data-js9-active-theme", opts.theme)
        .attr("data-js9-active-density", opts.density)
        .css({"--js9-global-accent": opts.accent, "--js9-global-accent-contrast": JS9.Customize.readableText(opts.accent, "#ffffff"), "--js9-global-menu-background": opts.menuBackground, "--js9-global-menu-text": opts.menuText});
    $(`#${display.id}Menubar`).css({"--js9-menu-background": opts.menuBackground, "--js9-menu-text": opts.menuText, "--js9-menu-font-size": `${opts.menuFontSize}px`});
    display.toolbarTools = opts.toolbarTools.slice(0);
    if( display.pluginInstances.JS9Toolbar ){
	JS9.Toolbar.init.call(display.pluginInstances.JS9Toolbar);
    }
    $(`#${display.id}Menubar`).toggle(!!opts.menubar && !opts.minimal);
    $(`#${display.id}Toolbar`).toggle(!!opts.toolbar || opts.minimal);
    $(`#${display.id}Statusbar`).parent().toggle(!!opts.statusbar && !opts.minimal);
    JS9.Customize.applyTokens(display, opts);
    JS9.Customize.applyComponents(display, opts);
    $(`.dhtmlwindow[data-js9-display="${display.id}"]`).each(function(){ JS9.Customize.applyFloatingWindow(display, this.id); });
    JS9.Customize.write(display, opts);
    return opts;
};
JS9.Customize.componentEditor = function(div, update){
    const target = div.find("[name=componentTarget]").val() || "menu";
    const all = $.extend(true, {}, div.data("js9Components") || {});
    if( update ){
	all[target] = all[target] || {};
	["background", "textColor", "fontFamily", "padding", "borderColor"].forEach((field) => { const value = div.find(`[name=component${field}]`).val(); if( value ){ all[target][field] = value; } else { delete all[target][field]; } });
	["fontSize", "height", "radius"].forEach((field) => { const value = div.find(`[name=component${field}]`).val(); if( value !== "" ){ all[target][field] = `${value}px`; } else { delete all[target][field]; } });
	div.data("js9Components", all);
	return all;
    }
    const component = all[target] || {};
    div.find("[name=componentbackground]").val(component.background || "");
    div.find("[name=componenttextColor]").val(component.textColor || "");
    div.find("[name=componentfontFamily]").val(component.fontFamily || "");
    div.find("[name=componentfontSize]").val((component.fontSize || "").replace(/px$/, ""));
    div.find("[name=componentheight]").val((component.height || "").replace(/px$/, ""));
    div.find("[name=componentpadding]").val(component.padding || "");
    div.find("[name=componentradius]").val((component.radius || "").replace(/px$/, ""));
    div.find("[name=componentborderColor]").val(component.borderColor || "");
    return all;
};
JS9.Customize.getFormOptions = function(div){
    return {theme: div.find("[name=theme]").val(), accent: div.find("[name=accent]").val(), density: div.find("[name=density]").val(), minimal: div.find("[name=minimal]").prop("checked"), menubar: div.find("[name=menubar]").prop("checked"), toolbar: div.find("[name=toolbar]").prop("checked"), statusbar: div.find("[name=statusbar]").prop("checked"), menuBackground: div.find("[name=menuBackground]").val(), menuText: div.find("[name=menuText]").val(), menuFontSize: div.find("[name=menuFontSize]").val(), toolbarTools: div.find("[name=toolbarTool]:checked").map(function(){ return $(this).val(); }).get(), components: JS9.Customize.componentEditor(div, true)};
};
JS9.Customize.renderToolbarTools = function(div, opts){
    const selected = JS9.Customize.normalizeToolbarTools(opts.toolbarTools);
    const byName = {};
    JS9.Toolbar.tools.filter((tool) => tool.name !== "circle").forEach((tool) => { byName[tool.name] = tool; });
    div.find(".JS9CustomizeToolbarList").html(selected.concat(JS9.Toolbar.tools.map((tool) => tool.name).filter((name) => name !== "circle" && selected.indexOf(name) < 0)).map((name) => {
	const tool = byName[name];
	return `<div class="JS9CustomizeToolbarItem"><label><input name="toolbarTool" type="checkbox" value="${name}"${selected.indexOf(name) >= 0 ? " checked" : ""}> ${tool.tip || name}</label><span class="JS9CustomizeToolbarMove"><button type="button" data-toolbar-move="up" aria-label="move ${name} up">↑</button><button type="button" data-toolbar-move="down" aria-label="move ${name} down">↓</button></span></div>`;
    }).join(""));
};
JS9.Customize.updateForm = function(div, display, opts){
    div.find("[name=theme]").val(opts.theme);
    div.find("[name=accent]").val(opts.accent);
    div.find("[name=density]").val(opts.density);
    div.find("[name=minimal]").prop("checked", opts.minimal);
    div.find("[name=menuBackground]").val(opts.menuBackground);
    div.find("[name=menuText]").val(opts.menuText);
    div.find("[name=menuFontSize]").val(opts.menuFontSize);
    div.find("[name=menubar]").prop("checked", opts.menubar);
    div.find("[name=toolbar]").prop("checked", opts.toolbar);
    div.find("[name=statusbar]").prop("checked", opts.statusbar);
    div.data("js9Components", $.extend(true, {}, opts.components || {}));
    JS9.Customize.componentEditor(div, false);
    JS9.Customize.renderToolbarTools(div, opts);
    div.find("[name=width]").val(display.width);
    div.find("[name=height]").val(display.height);
};
JS9.Customize.init = function(){
    const div = this.divjq;
    const display = this.display;
    const render = () => JS9.Customize.updateForm(div, display, JS9.Customize.apply(display, JS9.Customize.getFormOptions(div)));
    div.html(`<form class="JS9CustomizeForm"><p class="JS9CustomizeIntro">Changes apply to this display immediately and are stored in this browser.</p><section class="JS9CustomizeSection"><h3 class="JS9CustomizeSectionTitle">Appearance</h3><div class="JS9CustomizeGrid JS9CustomizeGridThree"><label><span>Theme</span><select name="theme"><option value="light">Light</option><option value="dark">Dark</option><option value="midnight">Midnight</option><option value="contrast">High contrast</option></select></label><label><span>Accent</span><input name="accent" type="color" value="#2563eb"></label><label><span>Density</span><select name="density"><option value="standard">Standard</option><option value="compact">Compact</option></select></label></div></section><section class="JS9CustomizeSection"><h3 class="JS9CustomizeSectionTitle">Menu bar</h3><div class="JS9CustomizeGrid JS9CustomizeGridThree"><label><span>Background</span><input name="menuBackground" type="color" value="#e2e8f0"></label><label><span>Text</span><input name="menuText" type="color" value="#1e293b"></label><label><span>Text size</span><input name="menuFontSize" type="number" min="11" max="20" step="1"></label></div></section><section class="JS9CustomizeSection"><h3 class="JS9CustomizeSectionTitle">Layout</h3><div class="JS9CustomizeToggleGrid"><label><input name="menubar" type="checkbox"><span>Menu bar</span></label><label><input name="toolbar" type="checkbox"><span>Tool bar</span></label><label><input name="statusbar" type="checkbox"><span>Status bar</span></label></div><label class="JS9CustomizeMinimal"><input name="minimal" type="checkbox"><span>Quick-look mode — image, toolbar, and Colorbar only</span></label></section><section class="JS9CustomizeSection JS9CustomizeToolbar"><h3 class="JS9CustomizeSectionTitle">Toolbar tools</h3><p class="JS9CustomizeFieldHint">Choose the tools shown in this display. Use arrows to change their order.</p><div class="JS9CustomizeToolbarList"></div></section><section class="JS9CustomizeSection JS9CustomizeSize"><h3 class="JS9CustomizeSectionTitle">Display size</h3><div class="JS9CustomizeSizeGrid"><label><span>Width</span><input name="width" type="number" min="200" max="4096" step="1"></label><label><span>Height</span><input name="height" type="number" min="200" max="4096" step="1"></label><button type="button" name="resize">Apply size</button></div></section><section class="JS9CustomizeSection"><h3 class="JS9CustomizeSectionTitle">Shortcuts</h3><p class="JS9CustomizeShortcuts"><kbd>⌘O</kbd> open FITS <kbd>Z</kbd> zscale <kbd>I</kbd> full image <kbd>+</kbd>/<kbd>−</kbd> zoom <kbd>0</kbd> reset zoom</p></section><div class="JS9CustomizeActions"><button type="button" name="reset">Restore defaults</button></div></form>`);
    div.find(".JS9CustomizeActions").before(`<section class="JS9CustomizeSection JS9ComponentEditor"><h3 class="JS9CustomizeSectionTitle">Component style</h3><p class="JS9CustomizeFieldHint">Select a component, then set only the values you want to override.</p><div class="JS9CustomizeGrid JS9CustomizeGridThree"><label><span>Component</span><select name="componentTarget"><option value="menu">Menu bar</option><option value="toolbar">Tool bar</option><option value="status">Status bar</option><option value="window">Floating window</option><option value="form">Plugin form</option></select></label><label><span>Background</span><input name="componentbackground" placeholder="#172554"></label><label><span>Text color</span><input name="componenttextColor" placeholder="#f8fafc"></label><label><span>Font family</span><input name="componentfontFamily" placeholder="system-ui, sans-serif"></label><label><span>Font size (px)</span><input name="componentfontSize" type="number" min="8" max="48"></label><label><span>Height (px)</span><input name="componentheight" type="number" min="0" max="240"></label><label><span>Padding</span><input name="componentpadding" placeholder="6px 10px"></label><label><span>Corner radius (px)</span><input name="componentradius" type="number" min="0" max="48"></label><label><span>Border color</span><input name="componentborderColor" placeholder="#475569"></label></div></section>`);
    JS9.Customize.updateForm(div, display, JS9.Customize.read(display));
    div.find("input, select").on("change", render);
    div.find("[name=componentTarget]").on("change", () => JS9.Customize.componentEditor(div, false));
    div.on("click", "[data-toolbar-move]", function(){
	const item = $(this).closest(".JS9CustomizeToolbarItem");
	const neighbor = $(this).attr("data-toolbar-move") === "up" ? item.prev() : item.next();
	if( !neighbor.length ){
	    return;
	}
	if( $(this).attr("data-toolbar-move") === "up" ){
	    item.insertBefore(neighbor);
	} else {
	    item.insertAfter(neighbor);
	}
	render();
    });
    div.find("[name=resize]").on("click", () => {
        const width = parseInt(div.find("[name=width]").val(), 10);
        const height = parseInt(div.find("[name=height]").val(), 10);
        if( width >= 200 && height >= 200 ){
            JS9.ResizeDisplay(width, height, {display: display.id});
            JS9.Customize.updateForm(div, display, JS9.Customize.read(display));
        }
    });
    div.find("[name=reset]").on("click", () => {
        try{ localStorage.removeItem(JS9.Customize.storageKey(display)); }
        catch(ignore){ /* localStorage is optional */ }
        JS9.Customize.updateForm(div, display, JS9.Customize.apply(display, JS9.Customize.defaults));
    });
    JS9.Customize.apply(display, JS9.Customize.read(display));
};
JS9.mkPublic("GetInterface", function(...args){ const obj = JS9.parsePublicArgs(args); return JS9.Customize.read(JS9.lookupDisplay(obj.display)); });
JS9.mkPublic("SetInterface", function(...args){ const obj = JS9.parsePublicArgs(args); return JS9.Customize.apply(JS9.lookupDisplay(obj.display), obj.argv[0]); });
JS9.mkPublic("GetUIConfig", function(...args){ const obj = JS9.parsePublicArgs(args); const config = JS9.Customize.read(JS9.lookupDisplay(obj.display)); return $.extend({}, config, {tokens: config.uiTokens}); });
JS9.mkPublic("SetUIConfig", function(...args){
    const obj = JS9.parsePublicArgs(args);
    const config = obj.argv[0] || {};
    const requested = $.extend({}, config.interface || {});
    ["theme", "accent", "density", "minimal", "menubar", "toolbar", "statusbar", "menuBackground", "menuText", "menuFontSize", "toolbarTools", "uiClass"].forEach((key) => {
	if( Object.prototype.hasOwnProperty.call(config, key) ){ requested[key] = config[key]; }
    });
    if( config.layout && typeof config.layout === "object" ){
	["density", "minimal", "menubar", "toolbar", "statusbar", "toolbarTools"].forEach((key) => {
	    if( Object.prototype.hasOwnProperty.call(config.layout, key) ){ requested[key] = config.layout[key]; }
	});
    }
    if( config.tokens ){ requested.uiTokens = config.tokens; }
    if( config.components ){ requested.components = config.components; }
    return JS9.Customize.apply(JS9.lookupDisplay(obj.display), requested);
});
JS9.RegisterPlugin(JS9.Customize.CLASS, JS9.Customize.NAME, JS9.Customize.init, {menuItem: "Customize appearance", winTitle: "Customize appearance", winResize: true, winDims: [JS9.Customize.WIDTH, JS9.Customize.HEIGHT]});
