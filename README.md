# JS9MuV1 Lite

JS9MuV1 Lite is a deployable browser FITS viewer for astronomical quick-look,
image inspection, regions, WCS-aware measurements, and annular photometry. It
uses the JS9 3.9 runtime, retains the public JS9 API, and adds a modern,
theme-aware interface and integration layer.

**Release:** 1.5.1 · **License:** MIT

> JS9MuV1 is independently maintained and is not an official upstream JS9
> release. JS9 is credited in [Upstream attribution](#upstream-attribution-and-security).

## What it provides

- Local or remote FITS images, cubes, tables, and multi-extension files.
- Pan, zoom, colormaps, scaling, zscale, full-image reload, and a
  display-bound Colorbar.
- Region drawing, persistence, FITS WCS, pixel and angular measurements.
- Source-aperture plus background-annulus photometry with robust background,
  flux uncertainty, S/N, FWHM, and instrumental/calibrated magnitudes.
- Standard/Compact density and a Quick-look mode for an image-first preview
  workspace; the Customize panel also lists the principal keyboard shortcuts.
- `SetUIConfig()` for semantic design tokens, a host-page UI class, and a
  JSON-configurable observatory-branded interface.
- A standard Web Component, a Vue 3 wrapper, and explicit observatory
  quick-look, status, error, state, region, event, and photometry APIs.

## Architecture

The browser uses three layers. `js9.min.js` and the CSS files create the
viewer, menus, regions, WCS tools, and public API. `astroemw.wasm` performs
FITS decoding and numerical work in WebAssembly. `js9plugins.js`, the Web
Component, and the Vue wrapper supply optional analysis and app integration.

Themes apply only to menus, dialogs, controls, and panels; they do not modify
FITS pixels or scientific calculations. In annular photometry, the central disk
is the source aperture and surrounding pixels estimate the background before
calculating the reported measurement values.

## Start locally

Serve the directory over HTTP so the browser can load WebAssembly:

```sh
python3 -m http.server 8123
```

Open <http://127.0.0.1:8123/> for the start page, or
<http://127.0.0.1:8123/js9.html> for the standard viewer.

## Embed

```html
<link rel="stylesheet" href="/js9/js9support.css">
<link rel="stylesheet" href="/js9/js9.css">
<link rel="stylesheet" href="/js9/web-component/js9-viewer-element.css">
<script src="/js9/js9support.min.js"></script>
<script src="/js9/js9.min.js"></script>
<script src="/js9/js9plugins.js"></script>
<script src="/js9/web-component/js9-viewer-element.js"></script>

<js9-viewer display-id="science" width="900" height="600"
            src="/data/observation.fits"></js9-viewer>
```

Assign each viewer a distinct `display-id`. The component emits `js9-ready`,
`js9-load`, `js9-status`, and `js9-error`; it provides `load()`,
`loadFullImage()`, `zoomToFit()`, and `resize()` methods.

## Integration API

Use the standard `window.JS9` API plus these JS9MuV1 helpers:

- `LoadObservationPreview()` and `GetObservationPreviewStatus()`
- `GetViewerState()`, `ExportRegionsJSON()`, and `ImportRegionsJSON()`
- `Subscribe()` and `Unsubscribe()`
- `GetAnnulusPhotometry()` and `GetAllAnnulusPhotometry()`

They return explicit success/error states, intended for backend or observatory
integration instead of parsing a browser panel.

### Advanced UI configuration

`JS9.SetUIConfig()` applies and stores a high-level UI configuration per
display. It accepts all `SetInterface()` options plus `tokens` and `uiClass`:

```js
JS9.SetUIConfig({
  density: "compact",
  minimal: true,
  uiClass: "observatory-preview",
  tokens: {
    background: "#0b1020", surface: "#172554", control: "#0f172a",
    text: "#e0f2fe", muted: "#93c5fd", border: "#334155",
    titleBackground: "#172554", titleText: "#f8fafc",
    radius: "8px", fontFamily: "system-ui, sans-serif"
  }
}, { display: "science" });
```

Supported tokens are deliberately limited to visual values; the API does not
accept arbitrary CSS or HTML. Host-page CSS can target
`html[data-js9-ui-class="observatory-preview"]` for further application-owned
styling.

## Documentation

| Resource | Purpose |
| --- | --- |
| [Chinese deployment guide](%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) | Installation and integration guide |
| [Photometry reference](help/photometry.html) | Equations and scientific conventions |
| [Release notes](RELEASE_NOTES.md) | Version history |
| [Version manifest](VERSION.json) | Machine-readable package information |
| [Self-check](selfcheck.html) | Browser/runtime diagnostic page |
| [UI QA checklist](ui-qa.html) | Multi-display and responsive visual-regression checklist |
| [Vue wrapper README](vue/README.md) | Vue setup |
| [Web Component README](web-component/README.md) | Framework-neutral setup |

## Deployment notes

Keep `astroemw.wasm` beside the runtime files and serve it as
`application/wasm`. Remote FITS sources require suitable CORS headers, and
production pages should use HTTPS. Lite omits demos, tests, build sources, Node
dependencies, and the Vue example application.

## Upstream attribution and security

JS9MuV1 derives from JS9 by Eric Mandel and Alexey Vikhlinin at the Center for
Astrophysics | Harvard & Smithsonian. See [LICENSE](LICENSE) and the upstream
[JS9 repository](https://github.com/ericmandel/js9). The Lite deployment does
not include `js9Helper.js`; if you separately use that server helper, update it
from upstream before exposing it to a network.
