# JS9MuV1 Lite

JS9MuV1 Lite is a deployable, browser-based FITS viewer for astronomical
quick-look, image inspection, regions, WCS-aware measurements, and aperture
photometry. It is built from the [JS9](https://github.com/ericmandel/js9)
runtime and keeps the public JS9 API compatible while providing a modern,
theme-aware interface and application integration layer.

**Release:** 1.4.20 · **JS9 runtime:** 3.9 · **License:** MIT

> This is an independently maintained JS9MuV1 distribution, not an official
> release of the upstream JS9 project. Upstream JS9 development ended in 2022;
> see [Upstream attribution](#upstream-attribution-and-security) below.

## What it is for

- Open local or remote FITS images, cubes, tables, and multi-extension files.
- Inspect data with pan, zoom, colormaps, scale transforms, zscale, and a
  display-bound colorbar.
- Draw and persist image regions; use a source aperture plus sky annulus for
  scientific photometry.
- Read celestial coordinates from FITS WCS and show pixel values, angular
  scales, and region measurements.
- Embed one or more viewers in ordinary HTML, Vue 3, or any framework that can
  host a Web Component.
- Integrate an observatory quick-look stream using explicit load, retry,
  status, error, and measurement APIs.

## How it works

The browser loads three layers:

1. **Viewer shell** — `js9.css`, `js9support.min.js`, and `js9.min.js` create
   the display, menus, regions, WCS interaction, and public API.
2. **FITS engine** — `astroemw.wasm` performs FITS decoding and numerical work
   in WebAssembly. Keep it in the same deployed directory as the JS9 runtime.
3. **Optional integration layer** — `js9plugins.js` supplies analysis panels;
   the Web Component and Vue wrapper create isolated display instances and
   forward application-level events.

The image canvas is separate from interface chrome. Themes change menus,
dialogs, controls, and panels only; they do not alter FITS pixels or the
scientific values returned by the API.

For annular photometry, the inner disk is the source aperture and the annulus
between the inner and outer radii estimates the background. The Region Stats
panel reports robust-background-subtracted flux, uncertainty, S/N, FWHM, and
instrumental/calibrated magnitudes when calibration values are supplied. The
equations and conventions are documented in [Photometry reference](help/photometry.html).

## Start locally

Serve this directory over HTTP; do not rely on `file://` for WebAssembly assets:

```sh
python3 -m http.server 8123
```

Then open <http://127.0.0.1:8123/>. A minimal direct entry point is
<http://127.0.0.1:8123/js9.html>.

## Embed in a web page

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

Every viewer needs a unique `display-id`. The component emits `js9-ready`,
`js9-load`, `js9-status`, and `js9-error`; call `load()`, `loadFullImage()`,
`zoomToFit()`, or `resize()` on the element for application control.

## Integration API

The public JS9 API remains available through `window.JS9`. JS9MuV1 additionally
provides focused integration helpers:

- `JS9.LoadObservationPreview()` / `JS9.GetObservationPreviewStatus()` for
  completed-file gating, retry handling, and newest-frame quick look.
- `JS9.GetViewerState()` for serializable display metadata and visual state.
- `JS9.ExportRegionsJSON()` / `JS9.ImportRegionsJSON()` for region persistence.
- `JS9.Subscribe()` / `JS9.Unsubscribe()` for view and region events.
- `JS9.GetAnnulusPhotometry()` / `JS9.GetAllAnnulusPhotometry()` for stable,
  versioned source-plus-background measurements.

The returned results always include an explicit success or error state; do not
parse panel text or browser dialogs in an observatory application.

## Vue 3

Use `vue/JS9Viewer.vue` as the Vue wrapper. It exposes `displayId`, `src`,
`width`, `height`, and `colorbar` props, as well as its underlying viewer API.
The wrapper is optional: React, Angular, Svelte, and plain JavaScript can use
the same Web Component directly.

## Documentation and checks

| Resource | Purpose |
| --- | --- |
| [Chinese deployment guide](%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md) | Installation, UI use, framework integration, and API examples |
| [Photometry reference](help/photometry.html) | Scientific photometry method and equations |
| [Release notes](RELEASE_NOTES.md) | Changes in each JS9MuV1 Lite release |
| [Version manifest](VERSION.json) | Machine-readable release and package contents |
| [Self-check](selfcheck.html) | Browser dependency and runtime diagnostic page |
| [Vue wrapper README](vue/README.md) | Vue-specific setup |
| [Web Component README](web-component/README.md) | Framework-neutral component setup |

## Deployment notes

- Keep `astroemw.wasm` beside the runtime files and serve it with the
  `application/wasm` MIME type.
- Remote FITS sources require a server that permits browser CORS access.
- Use HTTPS in production; the browser’s normal mixed-content restrictions
  apply to HTTP image URLs.
- The package intentionally excludes demos, tests, build sources, Node
  dependencies, and the Vue example application. It includes the runtime,
  scientific plugins, help, Web Component, Vue wrapper, and documentation.

## Upstream attribution and security

JS9MuV1 derives from JS9 by Eric Mandel and Alexey Vikhlinin at the Center for
Astrophysics | Harvard & Smithsonian. JS9 is distributed under the MIT License;
see [LICENSE](LICENSE). Consult the upstream [JS9 repository](https://github.com/ericmandel/js9)
for its original history and acknowledgements.

The upstream project reported a JS9 Helper security issue in December 2024. The
Lite browser deployment does not include `js9Helper.js`. If you separately use
the helper or an older full JS9 installation, update it from upstream before
exposing it to a network.
