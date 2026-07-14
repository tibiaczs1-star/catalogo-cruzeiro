(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CzsAndroidDownload = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function cleanVersion(value) {
    const version = typeof value === "string" ? value.trim() : "";
    return /^\d+(?:\.\d+){1,3}(?:[-+][a-z0-9.-]+)?$/i.test(version) ? version : "1.0.0";
  }

  function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) return "";
    const megabytes = bytes / (1024 * 1024);
    return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1).replace(".", ",")} MB`;
  }

  function resolveDownloadState(metadata = {}, apkAvailable = false) {
    const version = cleanVersion(metadata.versionName);
    const size = formatBytes(metadata.sizeBytes);
    const enabled = metadata.status === "ready" && Boolean(size) && apkAvailable === true;
    if (enabled) return { enabled: true, detail: `Versão ${version} · ${size}` };
    if (metadata.status === "ready") {
      return { enabled: false, detail: `Versão ${version} · Download indisponível` };
    }
    return { enabled: false, detail: `Versão ${version} · Em preparação` };
  }

  async function loadDownloadState(fetchImpl, metadataUrl, downloadUrl) {
    let metadata = { status: "preparing", versionName: "1.0.0", sizeBytes: null };
    try {
      const metadataResponse = await fetchImpl(metadataUrl, { cache: "no-store" });
      if (metadataResponse.ok) metadata = await metadataResponse.json();
    } catch (_error) {
      return resolveDownloadState(metadata, false);
    }

    if (metadata?.status !== "ready") return resolveDownloadState(metadata, false);
    try {
      const apkResponse = await fetchImpl(downloadUrl, { method: "HEAD", cache: "no-store" });
      return resolveDownloadState(metadata, apkResponse.ok);
    } catch (_error) {
      return resolveDownloadState(metadata, false);
    }
  }

  async function initDownloadPanel(doc = document, fetchImpl = fetch) {
    const panel = doc.getElementById("androidDownloadPanel");
    const cta = doc.getElementById("androidDownloadCta");
    const detail = doc.getElementById("androidDownloadMeta");
    if (!panel || !cta || !detail) return;

    const metadataUrl = panel.dataset.metadataUrl;
    const downloadUrl = panel.dataset.downloadUrl;
    cta.addEventListener("click", (event) => {
      if (cta.getAttribute("aria-disabled") === "true") event.preventDefault();
    });

    const state = await loadDownloadState(fetchImpl, metadataUrl, downloadUrl);
    detail.textContent = state.detail;
    if (state.enabled) {
      cta.href = downloadUrl;
      cta.setAttribute("download", "");
      cta.setAttribute("aria-disabled", "false");
      cta.removeAttribute("tabindex");
      return;
    }

    cta.removeAttribute("href");
    cta.removeAttribute("download");
    cta.setAttribute("aria-disabled", "true");
    cta.setAttribute("tabindex", "-1");
  }

  if (typeof document !== "undefined") {
    const boot = () => initDownloadPanel(document, globalThis.fetch.bind(globalThis));
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
    else boot();
  }

  return { formatBytes, resolveDownloadState, loadDownloadState, initDownloadPanel };
});
