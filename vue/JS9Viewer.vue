<template>
  <section class="js9-viewer" :aria-label="label" :aria-busy="state === 'loading'">
    <div v-show="menubar" class="JS9Menubar" :data-js9id="resolvedDisplayId"></div>
    <div v-show="toolbar" class="JS9Toolbar" :data-js9id="resolvedDisplayId"></div>
    <div ref="canvasHost" class="js9-viewer__canvas">
      <div
        :id="resolvedDisplayId"
        class="JS9"
        :data-width="width"
        :data-height="height"
      ></div>
    </div>
    <div v-show="colorbar" class="js9-viewer__colorbar">
      <div class="JS9Colorbar" :data-js9id="resolvedDisplayId"></div>
    </div>
    <div v-show="statusbar" class="js9-viewer__status">
      <div class="JS9Statusbar" :data-js9id="resolvedDisplayId"></div>
    </div>
    <p v-if="showFeedback" class="js9-viewer__feedback" :data-state="state" role="status">{{ statusText }}</p>
    <div v-if="errorMessage" class="js9-viewer__error" role="alert">
      <p>{{ errorMessage }}</p>
      <button v-if="lastSource" type="button" @click="retry">Retry</button>
    </div>
  </section>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  /** Optional stable ID. Supply one when restoring a saved JS9 session. */
  displayId: { type: String, default: "" },
  width: { type: Number, default: 640 },
  height: { type: Number, default: 480 },
  /** FITS URL, File, or Blob to load after the display is ready. */
  src: { type: [String, Object], default: null },
  /** Optional image URLs or { source, options } entries to preload after initialization. */
  preloadSources: { type: Array, default: () => [] },
  imageOptions: { type: Object, default: () => ({}) },
  menubar: { type: Boolean, default: true },
  toolbar: { type: Boolean, default: true },
  colorbar: { type: Boolean, default: true },
  statusbar: { type: Boolean, default: true },
  showFeedback: { type: Boolean, default: true },
  label: { type: String, default: "JS9 image viewer" }
});

const emit = defineEmits(["ready", "load", "preload", "error", "status"]);
const canvasHost = ref(null);
const instance = getCurrentInstance();
const autoId = `js9-vue-${instance.uid}`;
const resolvedDisplayId = computed(() => props.displayId || autoId);
let initialized = false;
const state = ref("initializing");
const errorMessage = ref("");
const lastSource = ref(null);
const statusText = computed(() => ({
  initializing: "Initializing JS9…",
  ready: "Viewer ready",
  loading: "Loading image…",
  loaded: "Image loaded",
  error: "Unable to load JS9 or the image"
}[state.value] || ""));

const getJS9 = () => window.JS9;
const getJQuery = () => window.jQuery || window.$;
const displayOptions = () => ({ display: resolvedDisplayId.value });
const waitForJS9Ready = (js9) => new Promise((resolve) => {
  let settled = false;
  const finish = () => {
    if( !settled ){
      settled = true;
      resolve();
    }
  };
  const check = () => {
    if( js9.readied || (js9.fits?.ready && typeof js9.helper?.send === "function") ){
      finish();
    } else {
      window.setTimeout(check, 25);
    }
  };
  const jquery = getJQuery();
  if( jquery ){
    jquery(document).one("JS9:ready", finish);
  }
  check();
});
const setStatus = (next, detail = {}) => {
  state.value = next;
  emit("status", { state: next, ...detail });
};
const reportError = (error) => {
  const normalized = error instanceof Error ? error : new Error(error?.message || "Unable to load the image. Check its URL, network access, and CORS configuration.");
  errorMessage.value = normalized.message;
  setStatus("error", { error: normalized });
  emit("error", normalized);
};
const onJS9Error = (event, detail = {}) => {
  if( state.value === "loading" ){
    event.preventDefault();
    reportError(detail.error || new Error(detail.message || "JS9 could not load the image."));
  }
};

function requireJS9(){
  const js9 = getJS9();
  if( !js9 || typeof js9.AddDivs !== "function" ){
    const error = new Error("JS9 is not loaded. Add the JS9 CSS and browser scripts before mounting JS9Viewer.");
    reportError(error);
    throw error;
  }
  return js9;
}

/** Load a FITS URL, File, or Blob into this display. */
function load(source = props.src, options = {}){
  if( !source ){
    reportError(new Error("Provide a FITS image URL first."));
    return null;
  }
  try {
    const js9 = requireJS9();
    lastSource.value = source;
    errorMessage.value = "";
    const callerOnload = options.onload || props.imageOptions.onload;
    const loadOptions = {
      ...props.imageOptions,
      ...options,
      onload: (image) => {
        if( typeof callerOnload === "function" ){
          callerOnload(image);
        }
        errorMessage.value = "";
        setStatus("loaded", { image });
        emit("load", image);
      }
    };
    setStatus("loading", { source });
    return js9.Load(source, loadOptions, displayOptions());
  } catch(error) {
    reportError(error);
    return null;
  }
}

function retry(){
  return lastSource.value ? load(lastSource.value) : null;
}

/**
 * Preload one or more FITS URLs for this display. Entries can be URL strings
 * or objects shaped as { source: "image.fits", options: { colormap: "viridis" } }.
 */
function preloadImages(entries = props.preloadSources){
  const js9 = requireJS9();
  const sources = Array.isArray(entries) ? entries : [entries];
  const args = [];
  sources.forEach((entry) => {
    if( typeof entry === "string" ){
        args.push(entry);
    } else if( typeof entry?.source === "string" ) {
      args.push(entry.source);
      if( entry.options ){
        args.push(entry.options);
      }
    }
  });
  if( !args.length ){
    return null;
  }
  args.push(displayOptions());
  const result = js9.Preload(...args);
  emit("preload", { sources, displayId: resolvedDisplayId.value });
  return result;
}

/** Reload the full source image rather than merely fitting the current view. */
function loadFullImage(){
  return requireJS9().DisplaySection("full", displayOptions());
}

function zoomToFit(){
  return requireJS9().SetZoom("toFit", displayOptions());
}

function resize(width = props.width, height = props.height){
  return requireJS9().ResizeDisplay(width, height, displayOptions());
}

function getImage(){
  const js9 = getJS9();
  return js9 ? js9.GetImage(displayOptions()) : null;
}

onMounted(async () => {
  const jquery = getJQuery();
  jquery?.(document).on("JS9:error", onJS9Error);
  try {
    const js9 = requireJS9();
    await nextTick();
    await waitForJS9Ready(js9);
    js9.AddDivs(resolvedDisplayId.value);
    initialized = true;
    setStatus("ready", { id: resolvedDisplayId.value });
    emit("ready", { id: resolvedDisplayId.value, display: js9.lookupDisplay(resolvedDisplayId.value) });
    if( props.preloadSources.length ){
      preloadImages();
    }
    if( props.src ){
      load();
    }
  } catch(error) {
    reportError(error);
  }
});

watch(() => props.src, (source) => {
  if( initialized && source ){
    load(source);
  }
});

watch(() => props.preloadSources, (sources) => {
  if( initialized && sources?.length ){
    preloadImages(sources);
  }
}, { deep: true });

watch([() => props.width, () => props.height], ([width, height]) => {
  if( initialized ){
    resize(width, height);
  }
});

onBeforeUnmount(() => {
  getJQuery()?.(document).off("JS9:error", onJS9Error);
  if( initialized && getJS9() ){
    getJS9().CloseDisplay(resolvedDisplayId.value);
  }
});

defineExpose({ getImage, load, loadFullImage, preloadImages, resize, resolvedDisplayId, retry, state, zoomToFit });
</script>

<style>
.js9-viewer { display: inline-block; max-width: 100%; }
.js9-viewer__canvas { max-width: 100%; overflow: auto; }
.js9-viewer__colorbar { width: fit-content; max-width: 100%; margin-top: 2px; overflow: hidden; }
.js9-viewer__status { margin-top: 2px; }
.js9-viewer__feedback { margin: 8px 0 0; color: #475569; font: 13px/1.4 system-ui, sans-serif; }
.js9-viewer__feedback[data-state="loading"] { color: #2563eb; }
.js9-viewer__feedback[data-state="loaded"] { color: #047857; }
.js9-viewer__feedback[data-state="error"] { color: #b91c1c; }
.js9-viewer__error { margin-top: 8px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; background: #fef2f2; font: 13px/1.45 system-ui, sans-serif; }
.js9-viewer__error p { margin: 0; }
.js9-viewer__error button { margin-top: 8px; border: 0; border-radius: 6px; padding: 6px 9px; color: #fff; background: #b91c1c; font: inherit; cursor: pointer; }
</style>
