/* ==========================================================================
   config-loader.js
   Loads the external JSON configuration files.
   Everything is namespaced under the global STROOP object.
   ========================================================================== */

window.STROOP = window.STROOP || {};

STROOP.CONFIG_FILES = {
  settings: "config/settings.json",
  words: "config/words.json",
  text: "config/text.json",
  text_en: "config/text_en.json",
};

/**
 * Fetch and parse a single JSON config file.
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Could not load "${url}" (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Load all configuration files in parallel.
 * @returns {Promise<{settings:Object, words:Object, text:Object}>}
 */
STROOP.loadConfigs = async function loadConfigs() {
  const entries = Object.entries(STROOP.CONFIG_FILES);
  const results = await Promise.all(entries.map(([, url]) => fetchJSON(url)));
  const config = {};
  entries.forEach(([key], i) => (config[key] = results[i]));
  return config;
};
