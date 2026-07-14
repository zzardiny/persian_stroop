/* ==========================================================================
   utils.js
   Pure helper functions: shuffling, color/key mapping, stimulus generation
   (emotional + classic color-word), counterbalancing, language helpers.
   ========================================================================== */

window.STROOP = window.STROOP || {};
STROOP.lang = STROOP.lang || "fa";

STROOP.utils = (function () {
  /** Fisher–Yates in-place shuffle (returns the same array). */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Random integer in [min, max]. */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Language-aware color label. */
  function colorLabel(settings, color) {
    const def = settings.colors[color];
    return STROOP.lang === "en" ? def.label_en : def.label_fa;
  }

  /** Invert the key→color map into a color→key map. */
  function colorKeyMapFrom(settings) {
    const map = {};
    Object.entries(settings.key_color_map).forEach(([key, color]) => {
      map[color] = key;
    });
    return map;
  }

  /**
   * Determine the counterbalancing group and apply the matching
   * key→color mapping to settings (mutates settings.key_color_map).
   * Returns the group index (0-based) or null if disabled.
   */
  function applyCounterbalance(settings) {
    const cb = settings.counterbalance;
    if (!cb || !cb.enabled || !Array.isArray(cb.mappings) || !cb.mappings.length) {
      return null;
    }
    // URL override: ?group=N (1-based) wins if valid.
    let group = null;
    try {
      const urlGroup = new URLSearchParams(window.location.search).get("group");
      if (urlGroup !== null && urlGroup !== "") {
        const g = parseInt(urlGroup, 10) - 1;
        if (!isNaN(g) && g >= 0 && g < cb.mappings.length) group = g;
      }
    } catch (e) {}

    if (group === null) {
      if (cb.method === "localstorage") {
        let counter = 0;
        try {
          counter = parseInt(localStorage.getItem("stroop_cb_counter") || "0", 10);
          localStorage.setItem("stroop_cb_counter", String(counter + 1));
        } catch (e) {
          counter = Math.floor(Math.random() * cb.mappings.length);
        }
        group = counter % cb.mappings.length;
      } else {
        group = Math.floor(Math.random() * cb.mappings.length);
      }
    }
    settings.key_color_map = Object.assign({}, cb.mappings[group]);
    return group;
  }

  /** Build a balanced list of colors of a given length. */
  function balancedColorPool(colors, length) {
    const pool = [];
    let i = 0;
    while (pool.length < length) {
      pool.push(colors[i % colors.length]);
      i++;
    }
    return shuffle(pool);
  }

  /**
   * Generate emotional-Stroop stimuli (one entry per trial).
   * @param {Object} opts { practice: boolean }
   */
  function buildStimuli(settings, words, opts) {
    opts = opts || {};
    const practice = !!opts.practice;
    const colors = Object.keys(settings.colors);
    const colorKeyMap = colorKeyMapFrom(settings);

    let wordList = [];
    if (practice) {
      wordList = (words.practice_words || []).map((w) => ({
        word: w,
        category: "practice",
      }));
    } else {
      Object.entries(words.categories).forEach(([cat, def]) => {
        (def.words || []).forEach((w) =>
          wordList.push({ word: w, category: cat })
        );
      });
    }

    const reps = practice
      ? settings.trials.practice_repetitions
      : settings.trials.main_repetitions;

    const stimuli = [];
    for (let r = 0; r < reps; r++) {
      const pool = balancedColorPool(colors, wordList.length);
      wordList.forEach((wo, idx) => {
        const color = pool[idx];
        stimuli.push({
          task_type: "emotional",
          word: wo.word,
          category: wo.category,
          color: color,
          color_hex: settings.colors[color].hex,
          color_label: colorLabel(settings, color),
          congruency: "na",
          correct_response: colorKeyMap[color],
          repetition: r + 1,
        });
      });
    }

    if (settings.trials.randomize) shuffle(stimuli);
    return stimuli;
  }

  /**
   * Generate classic color-word Stroop stimuli.
   * The WORD is a color name; the FONT is one of the colors.
   * congruent  = word meaning matches font color
   * incongruent = word meaning differs from font color
   */
  function buildClassicStimuli(settings) {
    const colors = Object.keys(settings.colors);
    const colorKeyMap = colorKeyMapFrom(settings);
    const reps = (settings.classic && settings.classic.repetitions) || 2;
    const congruentRatio =
      settings.classic && typeof settings.classic.congruent_ratio === "number"
        ? settings.classic.congruent_ratio
        : 0.5;

    const stimuli = [];
    for (let r = 0; r < reps; r++) {
      colors.forEach((fontColor) => {
        const congruent = Math.random() < congruentRatio;
        let wordColor = fontColor;
        if (!congruent) {
          const others = colors.filter((c) => c !== fontColor);
          wordColor = others[Math.floor(Math.random() * others.length)];
        }
        stimuli.push({
          task_type: "classic",
          word: colorLabel(settings, wordColor), // the color NAME shown
          word_color: wordColor,
          category: congruent ? "congruent" : "incongruent",
          color: fontColor, // the FONT color = the response target
          color_hex: settings.colors[fontColor].hex,
          color_label: colorLabel(settings, fontColor),
          congruency: congruent ? "congruent" : "incongruent",
          correct_response: colorKeyMap[fontColor],
          repetition: r + 1,
        });
      });
    }
    if (settings.trials.randomize) shuffle(stimuli);
    return stimuli;
  }

  /** Valid response keys (adds uppercase variants when enabled). */
  function responseChoices(settings) {
    const keys = settings.response.keys.map((k) => k.toLowerCase());
    if (settings.response.allow_uppercase) {
      return keys.concat(keys.map((k) => k.toUpperCase()));
    }
    return keys;
  }

  /** HTML for the persistent on-screen key reminder. */
  function keyReminderHTML(settings) {
    const items = settings.response.keys
      .map((key) => {
        const color = settings.key_color_map[key];
        const def = settings.colors[color];
        return `<div class="mini"><span class="cap">${key.toUpperCase()}</span>
                <span style="color:${def.hex};font-weight:700">${colorLabel(
          settings,
          color
        )}</span></div>`;
      })
      .join("");
    return `<div class="trial-key-reminder">${items}</div>`;
  }

  return {
    shuffle,
    randInt,
    colorLabel,
    colorKeyMapFrom,
    applyCounterbalance,
    buildStimuli,
    buildClassicStimuli,
    responseChoices,
    keyReminderHTML,
  };
})();
