/* ==========================================================================
   experiment.js
   Orchestrates the experiment: language, counterbalancing, timeline assembly
   (emotional + classic blocks), fullscreen, data tagging, CSV export and an
   optional POST to a remote endpoint.
   ========================================================================== */

window.STROOP = window.STROOP || {};

STROOP.experiment = (function () {
  function makeFilename(settings) {
    const prefix = settings.data.filename_prefix || "stroop";
    const code = (STROOP.state && STROOP.state.participant_code) || "anon";
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${prefix}_${code}_${stamp}.csv`;
  }

  function downloadCSV(settings) {
    const csv = jsPsych.data.get().csv();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = makeFilename(settings);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Optional: POST the collected data to a remote endpoint. */
  function saveRemote(settings) {
    const url = settings.data && settings.data.save_url;
    if (!url) return;
    const fmt = (settings.data.save_format || "csv").toLowerCase();
    const body =
      fmt === "json" ? jsPsych.data.get().json() : jsPsych.data.get().csv();
    const headers = {
      "Content-Type": fmt === "json" ? "application/json" : "text/csv",
    };
    fetch(url, {
      method: settings.data.save_method || "POST",
      headers: headers,
      body: body,
    }).catch(function (e) {
      console.warn("Remote data save failed:", e);
    });
  }

  /** Apply text direction for the chosen language. */
  function applyDirection(lang) {
    const dir = lang === "en" ? "ltr" : "rtl";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }

  /**
   * @param {Object} config { settings, words, text, text_en }
   * @param {string} lang   "fa" | "en"
   */
  function run(config, lang) {
    const { settings, words } = config;
    STROOP.lang = lang || (settings.language && settings.language.default) || "fa";
    const text = STROOP.lang === "en" ? config.text_en : config.text;
    applyDirection(STROOP.lang);

    STROOP.state = { participant_code: "anon" };

    // Counterbalancing (may overwrite settings.key_color_map).
    const cbGroup = STROOP.utils.applyCounterbalance(settings);

    window.jsPsych = initJsPsych({
      display_element: "jspsych-target",
      show_progress_bar: true,
      auto_update_progress_bar: true,
      message_progress_bar: STROOP.lang === "en" ? "Progress" : "پیشرفت آزمون",
      on_finish: function () {
        saveRemote(settings);
        if (settings.data.auto_download_csv) downloadCSV(settings);
      },
    });

    jsPsych.data.addProperties({
      experiment: settings.experiment.title,
      version: settings.experiment.version,
      language: STROOP.lang,
      cb_group: cbGroup != null ? cbGroup + 1 : "",
    });

    const P = STROOP.pages;
    const T = STROOP.trials;
    const timeline = [];

    timeline.push({
      type: jsPsychPreload,
      auto_preload: true,
      message: `<div class="stroop-loading"><div class="spinner"></div><p>${text.common.loading}</p></div>`,
    });

    timeline.push(P.welcome(text));

    const info = P.participantInfo(text);
    info.on_finish = function (data) {
      try {
        const r = data.response || {};
        jsPsych.data.addProperties({
          participant_code: r.participant_code || "anon",
          age: r.age || "",
          gender: r.gender || "",
          handedness: r.handedness || "",
          education: r.education || "",
        });
        if (r.participant_code) STROOP.state.participant_code = r.participant_code;
      } catch (e) {
        console.warn("participant info parse failed", e);
      }
    };
    timeline.push(info);

    timeline.push(P.consent(text));

    if (settings.display.fullscreen) {
      timeline.push({
        type: jsPsychFullscreen,
        fullscreen_mode: true,
        message: `<div class="stroop-card" style="text-align:center"><p>${text.common.fullscreen_message}</p></div>`,
        button_label: text.common.fullscreen_button,
      });
    }

    timeline.push(P.instructions(text, settings));

    // ---------------- Emotional block ----------------
    if (!settings.blocks || settings.blocks.emotional !== false) {
      timeline.push(
        P.message(
          text.practice.start_heading,
          text.practice.start_body,
          text.practice.start_button
        )
      );
      const practiceStimuli = STROOP.utils.buildStimuli(settings, words, {
        practice: true,
      });
      T.buildBlock(settings, text, practiceStimuli, {
        block: "practice",
        showFeedback: settings.trials.show_practice_feedback,
      }).forEach((tr) => timeline.push(tr));

      timeline.push(
        P.message(
          text.practice.end_heading,
          text.practice.end_body,
          text.practice.start_main_button
        )
      );
      const mainStimuli = STROOP.utils.buildStimuli(settings, words, {
        practice: false,
      });
      T.buildBlock(settings, text, mainStimuli, {
        block: "main",
        showFeedback: settings.trials.show_main_feedback,
      }).forEach((tr) => timeline.push(tr));
    }

    // ---------------- Classic color-word block ----------------
    if (settings.blocks && settings.blocks.classic) {
      timeline.push(
        P.message(
          text.classic.start_heading,
          text.classic.start_body,
          text.classic.start_button
        )
      );
      const classicStimuli = STROOP.utils.buildClassicStimuli(settings);
      T.buildBlock(settings, text, classicStimuli, {
        block: "classic",
        showFeedback: settings.classic && settings.classic.show_feedback,
      }).forEach((tr) => timeline.push(tr));
    }

    if (settings.display.fullscreen) {
      timeline.push({ type: jsPsychFullscreen, fullscreen_mode: false });
    }

    timeline.push(STROOP.results.page(text, settings));

    const bye = P.goodbye(text);
    bye.on_finish = function () {
      downloadCSV(settings);
    };
    timeline.push(bye);

    jsPsych.run(timeline);
  }

  return { run, downloadCSV, saveRemote };
})();
