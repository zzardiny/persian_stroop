/* ==========================================================================
   trials.js
   Builders for the core Stroop trial sequence:
   fixation -> stimulus -> (feedback | inter-trial-interval)
   ========================================================================== */

window.STROOP = window.STROOP || {};

STROOP.trials = (function () {
  /** Wrap trial content in a vertically & horizontally centered stage. */
  function stage(inner) {
    return `<div class="stroop-stage">${inner}</div>`;
  }

  /* ---------- Fixation cross ---------- */
  function fixation(settings, text) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: stage(`<div class="stroop-fixation">${text.trial.fixation}</div>`),
      choices: "NO_KEYS",
      trial_duration: function () {
        const base = settings.timing.fixation_duration_ms;
        const jit = settings.timing.fixation_jitter_ms || 0;
        return base + STROOP.utils.randInt(0, jit);
      },
      data: { task: "fixation" },
    };
  }

  /* ---------- One Stroop stimulus ---------- */
  function stimulus(settings, text, stim, block) {
    const size = settings.display.stimulus_font_size_px;
    const reminder = STROOP.utils.keyReminderHTML(settings);
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus:
        stage(
          `<div class="stroop-stimulus" style="color:${stim.color_hex};font-size:${size}px">${stim.word}</div>`
        ) + reminder,
      choices: STROOP.utils.responseChoices(settings),
      trial_duration: settings.timing.response_window_ms,
      // Keep the CSV clean: don't store the raw HTML stimulus markup.
      save_trial_parameters: { stimulus: false },
      data: {
        task: "stroop",
        task_type: stim.task_type,
        block: block,
        word: stim.word,
        category: stim.category,
        color: stim.color,
        color_label: stim.color_label,
        congruency: stim.congruency,
        correct_response: stim.correct_response,
        repetition: stim.repetition,
      },
      on_finish: function (data) {
        const resp = data.response ? String(data.response).toLowerCase() : null;
        data.response_key = resp;
        data.correct = resp !== null && resp === data.correct_response;
        data.responded = resp !== null;
      },
    };
  }

  /* ---------- Feedback (practice only, by default) ---------- */
  function feedback(settings, text) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      choices: "NO_KEYS",
      trial_duration: settings.timing.feedback_duration_ms,
      stimulus: function () {
        const last = jsPsych.data.get().last(1).values()[0];
        const f = text.feedback;
        let inner;
        if (!last || !last.responded) {
          inner = `<div class="stroop-feedback slow">${f.too_slow}</div>`;
        } else if (last.correct) {
          inner = `<div class="stroop-feedback correct">${f.correct}</div>`;
        } else {
          inner = `<div class="stroop-feedback incorrect">${f.incorrect}</div>`;
        }
        return stage(inner);
      },
      data: { task: "feedback" },
    };
  }

  /* ---------- Blank inter-trial interval ---------- */
  function iti(settings) {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: "",
      choices: "NO_KEYS",
      trial_duration: settings.timing.inter_trial_interval_ms,
      data: { task: "iti" },
    };
  }

  /**
   * Build a full block (practice or main) as a flat timeline array.
   * @param {Object} settings
   * @param {Object} text
   * @param {Array}  stimuli
   * @param {Object} opts { block: 'practice'|'main', showFeedback: boolean }
   */
  function buildBlock(settings, text, stimuli, opts) {
    const timeline = [];
    const showFeedback = !!opts.showFeedback;
    stimuli.forEach((stim) => {
      timeline.push(fixation(settings, text));
      timeline.push(stimulus(settings, text, stim, opts.block));
      timeline.push(showFeedback ? feedback(settings, text) : iti(settings));
    });
    return timeline;
  }

  return { fixation, stimulus, feedback, iti, buildBlock };
})();
