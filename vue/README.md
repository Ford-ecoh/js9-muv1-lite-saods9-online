# JS9Viewer for Vue 3

`JS9Viewer.vue` provides a Vue lifecycle wrapper around the browser version of JS9. It does not bundle JS9: copy the JS9 distribution to your application's public directory and copy this component into `src/components/`, then load the browser assets before mounting it.

## Install the JS9 browser assets

Place the JS9 distribution under your application's public directory (for example `public/js9/`) and copy `vue/JS9Viewer.vue` to `src/components/JS9Viewer.vue`. Then add these tags to the application HTML entry point:

```html
<link rel="stylesheet" href="/js9/js9support.css">
<link rel="stylesheet" href="/js9/js9.css">
<script src="/js9/js9support.min.js"></script>
<script src="/js9/js9.min.js"></script>
<script src="/js9/js9plugins.js"></script>
```

The component intentionally accesses JS9 only after mounting, so it is safe to import from a Vue SSR application as long as it is rendered client-side.

## Usage

```vue
<script setup>
import { ref } from "vue";
import JS9Viewer from "@/components/JS9Viewer.vue";

const viewer = ref(null);
</script>

<template>
  <JS9Viewer
    ref="viewer"
    display-id="science-image"
    src="/data/observation.fits"
    :width="960"
    :height="640"
    @ready="({ id }) => console.log(`JS9 display ready: ${id}`)"
    @load="image => console.log(image.id)"
    @error="console.error"
  />
  <button @click="viewer.loadFullImage()">加载整幅图</button>
  <button @click="viewer.zoomToFit()">适应窗口</button>
</template>
```

## Props and exposed methods

- Props: `displayId`, `width`, `height`, `src`, `imageOptions`, `menubar`, `toolbar`, `statusbar`, `label`.
- Events: `ready`, `load`, `error`.
- Methods through the component ref: `load(source, options)`, `loadFullImage()`, `zoomToFit()`, `resize(width, height)`, `getImage()`.

`loadFullImage()` calls JS9 `DisplaySection("full")`; it loads the full data region, unlike `zoomToFit()` which only changes the viewport scale.
