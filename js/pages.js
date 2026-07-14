/* ==========================================================================
   pages.js
   Builders for the non-trial pages: welcome, participant info, consent,
   instructions, practice bridges and the ending screen.
   Each function returns a jsPsych trial (or an array of trials).
   ========================================================================== */

window.STROOP = window.STROOP || {};

STROOP.pages = (function () {
  /* ---------- Welcome ---------- */
  function welcome(text) {
    const t = text.welcome;
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <div class="stroop-card" style="text-align:center">
          <h1>${t.title}</h1>
          <p class="stroop-subtitle">${t.subtitle}</p>
        </div>`,
      choices: [t.start_button],
    };
  }

  /* ---------- Participant information ---------- */
  function participantInfo(text) {
    const p = text.participant;
    const opt = (obj) =>
      Object.entries(obj)
        .map(([v, label]) => `<option value="${v}">${label}</option>`)
        .join("");

    return {
      type: jsPsychSurveyHtmlForm,
      preamble: `<div class="stroop-card"><h2>${p.heading}</h2></div>`,
      html: `
        <div class="stroop-card stroop-form">
          <label for="pid">${p.code_label}</label>
          <input type="text" id="pid" name="participant_code" />

          <label for="age">${p.age_label}</label>
          <input type="number" id="age" name="age" min="1" max="120" required />

          <label for="gender">${p.gender_label}</label>
          <select id="gender" name="gender" required>
            <option value="" disabled selected></option>
            ${opt(p.gender_options)}
          </select>

          <label for="hand">${p.handedness_label}</label>
          <select id="hand" name="handedness" required>
            <option value="" disabled selected></option>
            ${opt(p.handedness_options)}
          </select>

          <label for="edu">${p.education_label}</label>
          <select id="edu" name="education" required>
            <option value="" disabled selected></option>
            ${opt(p.education_options)}
          </select>
        </div>`,
      button_label: p.continue_button,
      data: { task: "participant_info" },
    };
  }

  /* ---------- Consent ---------- */
  function consent(text) {
    const c = text.consent;
    const body = c.body.map((line) => `<li>${line}</li>`).join("");
    return {
      type: jsPsychSurveyHtmlForm,
      preamble: `
        <div class="stroop-card">
          <h2>${c.heading}</h2>
          <ul class="stroop-list">${body}</ul>
        </div>`,
      html: `
        <div class="stroop-card stroop-form">
          <div class="checkbox-row">
            <input type="checkbox" id="agree" name="consent" value="agreed" required />
            <label for="agree" style="margin:0">${c.checkbox_label}</label>
          </div>
        </div>`,
      button_label: c.agree_button,
      data: { task: "consent" },
    };
  }

  /* ---------- Instructions ---------- */
  function instructions(text, settings) {
    const ins = text.instructions;
    const legend = STROOP.utils
      ? settings.response.keys
          .map((key) => {
            const color = settings.key_color_map[key];
            const def = settings.colors[color];
            return `<div class="key-item">
                      <span class="key-cap">${key.toUpperCase()}</span>
                      <span class="key-color-name" style="color:${def.hex}">${STROOP.utils.colorLabel(
              settings,
              color
            )}</span>
                    </div>`;
          })
          .join("")
      : "";

    const pages = [
      `<div class="stroop-card"><h2>${ins.heading}</h2><p>${ins.pages[0]}</p></div>`,
      `<div class="stroop-card"><h2>${ins.heading}</h2><p>${ins.pages[1]}</p>
        <div class="key-legend">${legend}</div></div>`,
      `<div class="stroop-card"><h2>${ins.heading}</h2><p>${ins.pages[2]}</p></div>`,
    ];

    return {
      type: jsPsychInstructions,
      pages: pages,
      button_label_next: ins.next_button,
      button_label_previous: ins.prev_button,
      show_clickable_nav: true,
      key_forward: "ArrowLeft", // RTL: left arrow moves forward
      key_backward: "ArrowRight",
    };
  }

  /* ---------- Simple message screen (practice bridges, etc.) ---------- */
  function message(heading, body, buttonLabel) {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <div class="stroop-card" style="text-align:center">
          <h2>${heading}</h2>
          <p>${body}</p>
        </div>`,
      choices: [buttonLabel],
    };
  }

  /* ---------- Ending screen ---------- */
  function goodbye(text) {
    const e = text.end;
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <div class="stroop-card" style="text-align:center">
          <h2>${e.heading}</h2>
          <p>${e.body}</p>
        </div>`,
      choices: [e.download_button],
    };
  }

  return {
    welcome,
    participantInfo,
    consent,
    instructions,
    message,
    goodbye,
  };
})();
