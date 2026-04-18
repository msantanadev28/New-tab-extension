import { SEARCH_ENGINES } from "./constants.js";

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeUrl(rawValue) {
  const value = rawValue.trim();
  if (!value) {
    throw new Error("A URL is required.");
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) ? value : `https://${value}`;
  const parsed = new URL(withProtocol);

  if (parsed.protocol === "javascript:") {
    throw new Error("JavaScript URLs are not allowed.");
  }

  return parsed.toString();
}

export function getDisplayHost(rawUrl) {
  try {
    const { hostname } = new URL(rawUrl);
    return hostname.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}

export function getFaviconUrl(url) {
  return `chrome://favicon/size/64@1x/${url}`;
}

export function moveItem(list, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return list.slice();
  }

  const next = list.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function buildSearchUrl(engine, query) {
  const strategy = SEARCH_ENGINES[engine] ?? SEARCH_ENGINES.google;
  return strategy.buildUrl(query);
}

export function isCompact(settings) {
  return Boolean(settings?.compactLayout);
}
