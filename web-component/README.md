# JS9 Web Component

`<js9-viewer>` is the framework-neutral integration for JS9. It works in plain HTML and can be used by Vue, React, Angular, Svelte, Lit, or any system that supports standard custom elements.

Load JS9 first, then the component:

```html
<link rel="stylesheet" href="/js9/js9support.css">
<link rel="stylesheet" href="/js9/js9.css">
<link rel="stylesheet" href="/js9/web-component/js9-viewer-element.css">

<script src="/js9/js9support.min.js"></script>
<script src="/js9/js9.min.js"></script>
<script src="/js9/js9plugins.js"></script>
<script src="/js9/web-component/js9-viewer-element.js"></script>
```

## Plain HTML

```html
<js9-viewer
  display-id="science-image"
  width="900"
  height="600"
  src="/data/observation.fits"
></js9-viewer>
```

可直接打开 [`demos/js9webcomponent.html`](../demos/js9webcomponent.html) 查看无构建工具的完整示例。

## Common API

```js
const viewer = document.querySelector("js9-viewer");
viewer.load("/data/next-observation.fits");
viewer.loadFullImage(); // reload full source data
viewer.zoomToFit();     // only change viewport scale
viewer.resize(1200, 800);
```

Events are `js9-ready`, `js9-load`, `js9-status`, and `js9-error`. Each is a bubbling `CustomEvent`; its payload is in `event.detail`.

## Framework use

- **Vue**: use the existing `JS9Viewer.vue` wrapper for Vue refs and events, or use `<js9-viewer>` directly.
- **React**: render `<js9-viewer ref={viewerRef} />`; subscribe to custom events with `addEventListener` inside an effect.
- **Angular/Svelte/Lit**: render the native element and call its public methods through an element reference.

Available attributes: `display-id`, `src`, `width`, `height`, `menubar`, `toolbar`, `colorbar`, `statusbar`. The Colorbar is enabled by default and is bound to the image display width. Set a bar attribute to `"false"` to hide it.
