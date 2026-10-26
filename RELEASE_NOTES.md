# JS9MuV1 Lite 1.5.1

## Component-level appearance editor

- Added a Component style section to Customize appearance. Menu bar, toolbar,
  status bar, floating windows, and plugin forms can each set background,
  text, font, font size, height, padding, corner radius, and border color.
- Added the matching `components` object to `JS9.SetUIConfig()`.

# JS9MuV1 Lite 1.5.0

## UI architecture hardening

- Floating plugin windows now inherit the UIConfig of their owning display,
  allowing different viewers in one page to retain independent palettes.
- Extended the semantic styling bridge to third-party plugin controls, native
  file/color triggers, and supported scrollbars.
- Added `ui-qa.html`, a repeatable multi-display, responsive, touch, keyboard,
  and theme visual-regression checklist with a runtime API check.
- Documented the browser boundary: system file and color dialogs remain native,
  while their visible web controls are theme-aware.

# JS9MuV1 Lite 1.4.22

## Advanced UIConfig API

- Added `JS9.SetUIConfig()` and `JS9.GetUIConfig()` for persistent,
  application-controlled visual customization.
- Added safe semantic tokens for background, surface, form control, text,
  muted text, border, accent, title bar, radius, and font family; these apply
  to floating windows and legacy plugin controls as well as viewer chrome.
- Added an optional `ui` section to `theme.json`, plus an example observatory
  palette in `theme.example.json`.

# JS9MuV1 Lite 1.4.21

## Final UI refinements

- Added per-display Standard and Compact density choices to Customize appearance.
- Added Quick-look mode, which keeps the image, toolbar, and display-bound
  Colorbar while hiding the menu and status bars.
- Added a concise shortcut reference to Customize appearance and bound `Z` to
  zscale; existing open, full-image, zoom, and reset-zoom shortcuts are shown
  alongside it.

# JS9MuV1 Lite 1.4.20

## Project README refresh

- Replaced the inherited upstream README with a JS9MuV1-oriented overview of
  the deployment package, browser/WebAssembly architecture, annular
  photometry, framework integration, operational API, documentation, and
  deployment requirements.
- Preserved clear upstream JS9 attribution, the MIT-license reference, and the
  security guidance for anyone who separately deploys the optional JS9 Helper.

# JS9MuV1 Lite 1.4.19

## Touch-first interaction

- Added automatic touch behavior: one-finger drag pans, a stationary one-finger tap reports pixel/WCS position, and two-finger pinch remains zoom.
- Enlarged toolbar controls to 44px for coarse pointers and made the toolbar horizontally scrollable rather than compressing controls.
- Made floating windows and menus usable on narrow touch screens by constraining them to the viewport and allowing their content to scroll.

# JS9MuV1 Lite 1.4.18

## WCS first-class menu

- Restored WCS as a top-level menu between Regions and Analysis for direct coordinate-system, unit, alternate-WCS, and reprojection access.
- Kept Advanced focused on optional specialist tools.

# JS9MuV1 Lite 1.4.17

## WCS interaction removal

- Removed WCS coordinate-system and unit controls from the simplified Advanced menu.
- Kept FITS WCS parsing and public programmatic APIs intact, so celestial coordinates, angular Region Stats values, and observatory integrations continue to work.

# JS9MuV1 Lite 1.4.16

## Compact default navigation

- Simplified the default menu bar to File, View, Zoom, Scale, Color, Regions, Analysis, Advanced, and Help.
- Moved region editing, coordinate-system and unit selection, and specialist plugin panels into Advanced, preserving the corresponding JS9 APIs and plugin capabilities without crowding routine image inspection.
- Kept the compact toolbar focused on annotation, zscale/full-image loading, and essential zoom actions.

# JS9MuV1 Lite 1.4.15

## Custom dark-palette Region dialogs

- Fixed Region Edit and Save forms when a user keeps the Light preset but chooses a dark custom menu background: the forms now read the live foreground/background palette directly instead of relying on the preset name.
- Moved the final input, select, textarea, border, caret, and placeholder rules into the dynamically injected region form sources, so their legacy stylesheet cannot restore white fields with white text.

# JS9MuV1 Lite 1.4.14

## Legacy control-system modernization

- Replaced the remaining legacy button, command-console, search, archive-form, tooltip, floating-window, Spectrum color-picker, and Colorbar canvas control surfaces with the shared JS9 theme tokens.
- Dark, midnight, and high-contrast modes now explicitly cover injected controls as well as controls that are appended outside a floating window, preventing old white-card and light-text rules from resurfacing.
- Preserved public JS9 class names and existing widget geometry so third-party plugins remain compatible.

# JS9MuV1 Lite 1.4.13

## Region-dialog input contrast

- Corrected the last legacy form override used by Edit Region and Save Region: text fields, read-only region descriptions, numeric inputs, selects, text areas, and placeholders now keep an explicit readable foreground, dark surface, and visible border in dark, midnight, and high-contrast themes.
- Preserved the legacy region editor's geometry and controls while preventing its bundled white-text/white-field rules from reappearing after a theme change.

# JS9MuV1 Lite 1.4.12

## Customize dialog layout

- Replaced native fieldset/legend groups in Customize appearance with explicit card sections and internal headings.
- Section headings now remain inside their cards, eliminating titles that visually floated between the panel surface and the dialog background.
- Added explicit dark, midnight, and high-contrast card surfaces and borders for the dialog.

# JS9MuV1 Lite 1.4.11

## Integrated Colorbar companion

- Added a display-bound Colorbar to the Web Component and Vue wrapper by default, directly below each image display.
- Its width is the same as the associated image display, it follows display resize, and it can be disabled with `colorbar="false"` or the Vue `:colorbar="false"` prop.
- Colorbar tick labels and canvas surroundings now follow light, dark, midnight, and high-contrast palettes; theme changes redraw the Colorbar immediately.

# JS9MuV1 Lite 1.4.10

## Display-bound Colorbar

- Inline Colorbar instances now default to the width of their associated JS9 image display instead of an unrelated fixed 512-pixel width.
- The existing display resize lifecycle rebuilds the Colorbar at the new width; an explicit `data-width` remains an intentional fixed-size override for compact status-bar or custom layouts.

# JS9MuV1 Lite 1.4.9

## Dark-toolbar visual refinement

- Reworked dark toolbar button treatment after the initial icon inversion exposed an unattractive light button fill.
- Icon artwork is now inverted on a transparent image control, while a shared slate button surface, clearer border, and cyan hover feedback are rendered by the surrounding toolbar item.
- Textual and image-backed tools now share the same visual hierarchy in dark palettes.

# JS9MuV1 Lite 1.4.8

## Dark-toolbar icon visibility

- Corrected black Voyager SVG toolbar artwork becoming invisible on dark, midnight, and high-contrast toolbars.
- Image-backed tools now invert only in those dark palettes; textual tools and normal light-theme artwork keep their existing appearance.

# JS9MuV1 Lite 1.4.7

## Legacy-control style audit

- Replaced the hard-coded legacy styles behind `JS9Button2`, `JS9RunButton`, `JS9Select`, and parameter-dialog text fields with the shared theme-aware control palette.
- This covers old controls still used by Cube, Filters, Sync, Archive, Contour, Binning, loading and region parameter dialogs, while preserving the class names required by existing third-party plugins.
- Updated default, hover, active, focus, placeholder, read-only, and primary-action states to retain readable foreground/background contrast in light, dark, midnight, high-contrast, and custom themes.

# JS9MuV1 Lite 1.4.6

## Color Controls contrast fix

- Corrected standalone Color Controls panels, which bypassed the shared plugin wrapper and could inherit a light button face with a light label in dark or customized themes.
- Labels, select values, input values, placeholders, focus states, and hover states now use the same explicit foreground/background palette, so their default state is readable without moving the pointer over them.

# JS9MuV1 Lite 1.4.5

## Contrast and floating-panel audit

- Added automatic WCAG-style foreground correction for custom menu colors.
- Button text now switches between light and dark foregrounds for the selected accent color.
- Unified the Edit Region tab strip and legacy plugin-container controls with the active floating-window palette.

## Observation-system preview

- Added `JS9.LoadObservationPreview()` with completed-file gating, finite retries, explicit status events, and newest-frame priority per display.
- Added `JS9.GetObservationPreviewStatus()` and `JS9.GetImageQualitySummary()` for observatory dashboards.
- Added a configurable FITS parsing timeout so an invalid or stalled file enters an explicit failed state instead of remaining in loading.
- Normalized initial `zscale` and `zmax` options to JS9's load-time scale-clipping form, preventing an invalid-scale dialog during automated preview.
- Added English and Chinese guidance for quick-look FITS preview integration.

## Application integration API

- Added `JS9.GetViewerState()` for compact, serializable image metadata and visual state.
- Added `JS9.ExportRegionsJSON()` and `JS9.ImportRegionsJSON()` for versioned region persistence without a browser download.
- Added `JS9.Subscribe()` / `JS9.Unsubscribe()` and matching browser events for region and view changes.
- Documented the integration API in English and Chinese.

## Backend annulus-photometry API

- Added `JS9.GetAnnulusPhotometry()` for an existing annulus, a region id, or pixel-based `{x, y, sourceRadius, skyOuterRadius}` parameters.
- Added `JS9.GetAllAnnulusPhotometry()` for batch measurement of all displayed annuli.
- Both APIs return stable, versioned JSON with explicit success/error states, geometry, robust background, flux, uncertainty, S/N, FWHM, WCS scale, and magnitude results. Per-call calibration overrides do not alter the display settings.
- Added English API reference at `help/photometry.html` and Chinese integration examples in the deployment guide.

## Calibration action visibility

- Exposure, instrument zero point, and the Apply calibration action now share one compact row. The action uses a blue background with white text by default, while retaining a user-selected accent color when present.

## Photometry layout refinement

- The magnitude-calibration confirmation action is now a full-width, always-visible button below the exposure and zero-point inputs.
- Instrumental magnitude, calibrated magnitude, and magnitude error are presented together on one result row; count rate remains as a compact supporting value.

## Popup contrast correction

- Unified injected parameter dialogs with the floating-window theme system. Edit Region, Save Region, and related parameter forms now have explicit high-contrast text, fields, buttons, borders, and focus states in dark, midnight, and high-contrast themes.

## Release audit and final panel polish

- Corrected two legacy demo links and made the Vue example use relative runtime paths, so the built example works from a subdirectory instead of assuming a site-root deployment.
- Synchronized the Vue source assets and built distribution assets with the current JS9 runtime.
- Reworked the remaining legacy Cube, Image Arithmetic, Separate/Gather, and Image Filters panel markup to use the shared responsive panel system; empty states now use the same theme-aware presentation.
- Corrected the malformed Image Arithmetic operation selector attribute, which could prevent its native select control from being styled and recognized reliably.
- Verified local HTML resource references for both the full and Lite editions, checked generated runtime asset hashes across Lite and Vue, and smoke-tested the Plugin Lab without console errors.

## Interface consistency

- Added a shared, theme-aware visual layer for the core plugin panels.
- Unified typography, form controls, buttons, focus states, surfaces, borders, selected rows, and status-bar states.
- Updated the common appearance of Scale, Color Controls, Pan/Zoom, Layers, Blend, Blink, Extensions, Sync, and related core panels without changing their scientific or operational behavior.
- Region Stats now follows the selected JS9 interface theme instead of always forcing a dark panel.
- Modernized the second-level UI: dropdown and nested menus, menu inputs, floating plugin-window title bars, close controls, and resize/status strips now use the same palette and interaction states.
- Fixed the default toolbar so it no longer silently appends legacy tools. It now shows only the configured compact list; additional tools remain available through Customize.
- Fixed a theme regression in which the dark, midnight, or contrast theme could paint the JS9 image-canvas stacking layer and hide a loaded FITS image. Themes now apply only to interface chrome and plugin panels.
- Floating plugin windows now inherit the active menu palette even when the theme is customized manually; dark, midnight, and contrast variants also apply a matching title bar, content surface, cards, borders, and resize strip.
- Rebuilt Color Controls, Pan/Zoom Controls, and Sync Images around responsive grids; they no longer rely on fixed absolute columns at narrow widths.
- Removed invalid paragraph/div nesting from Color Controls, Pan/Zoom Controls, and Scale Controls; corrected a malformed Sync checkbox attribute and footer markup.
- Improved Scale, Blend, Blink, and Extensions text hierarchy, chart labels, empty states, and button alignment.
- Rebuilt the Customize appearance dialog as grouped responsive form grids, increased its usable default width, and made its fields theme-aware.

## Compatibility

No public JavaScript API, FITS processing, plugin calculations, or Vue/Web Component interface has changed.
