/* ==========================================================================
   results.js
   Computes an on-screen summary of the participant's performance:
   - emotional block: mean RT + accuracy per category, emotional-bias indices
   - classic block:   congruent vs incongruent RT (Stroop effect)
   - an SVG bar chart of mean RTs
   - a short textual interpretation
   ========================================================================== */

window.STROOP = window.STROOP || {};

STROOP.results = (function () {
  const BIAS_THRESHOLD_MS = 15;

  function mean(arr) {
    if (!arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function statOf(rows) {
    const correct = rows.filter((r) => r.correct);
    const rts = correct.map((r) => r.rt).filter((x) => typeof x === "number");
    return {
      n: rows.length,
      accuracy: rows.length ? correct.length / rows.length : null,
      meanRT: mean(rts),
    };
  }

  /** Summarise emotional block (mean RT + accuracy per category, bias). */
  function summarizeEmotional() {
    const rows = jsPsych.data
      .get()
      .filter({ task: "stroop", task_type: "emotional", block: "main" })
      .values();
    const cats = ["negative", "positive", "neutral"];
    const stats = {};
    cats.forEach((c) => (stats[c] = statOf(rows.filter((r) => r.category === c))));
    const neutral = stats.neutral.meanRT;
    const negBias =
      stats.negative.meanRT != null && neutral != null
        ? stats.negative.meanRT - neutral
        : null;
    const posBias =
      stats.positive.meanRT != null && neutral != null
        ? stats.positive.meanRT - neutral
        : null;
    return { stats, negBias, posBias, n: rows.length };
  }

  /** Summarise classic block (congruent vs incongruent). */
  function summarizeClassic() {
    const rows = jsPsych.data
      .get()
      .filter({ task: "stroop", task_type: "classic" })
      .values();
    if (!rows.length) return null;
    const congruent = statOf(rows.filter((r) => r.congruency === "congruent"));
    const incongruent = statOf(
      rows.filter((r) => r.congruency === "incongruent")
    );
    const effect =
      congruent.meanRT != null && incongruent.meanRT != null
        ? incongruent.meanRT - congruent.meanRT
        : null;
    return { congruent, incongruent, effect, n: rows.length };
  }

  function interpretEmotional(text, negBias, posBias) {
    const t = text.results;
    const negHigh = negBias != null && negBias > BIAS_THRESHOLD_MS;
    const posHigh = posBias != null && posBias > BIAS_THRESHOLD_MS;
    if (negHigh && posHigh) return t.interp_both;
    if (negHigh) return t.interp_negative;
    if (posHigh) return t.interp_positive;
    return t.interp_none;
  }

  /** Draw a simple SVG bar chart. bars = [{label, value, color}] */
  function svgBarChart(bars, axisLabel) {
    const W = 460,
      H = 260,
      padL = 46,
      padB = 44,
      padT = 14,
      padR = 14;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxV = Math.max(1, ...bars.map((b) => b.value || 0));
    const niceMax = Math.ceil(maxV / 100) * 100 || 100;
    const bw = plotW / bars.length;
    const barW = bw * 0.55;

    let gridlines = "";
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = (niceMax / steps) * i;
      const y = padT + plotH - (v / niceMax) * plotH;
      gridlines += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#2b303b" stroke-width="1"/>`;
      gridlines += `<text x="${padL - 6}" y="${y + 4}" fill="#a7afbd" font-size="11" text-anchor="end">${Math.round(v)}</text>`;
    }

    let rects = "";
    bars.forEach((b, i) => {
      const h = ((b.value || 0) / niceMax) * plotH;
      const x = padL + i * bw + (bw - barW) / 2;
      const y = padT + plotH - h;
      rects += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" fill="${b.color}"/>`;
      if (b.value != null)
        rects += `<text x="${x + barW / 2}" y="${y - 6}" fill="#f2f4f8" font-size="12" font-weight="700" text-anchor="middle">${Math.round(b.value)}</text>`;
      rects += `<text x="${x + barW / 2}" y="${H - padB + 18}" fill="#f2f4f8" font-size="12" text-anchor="middle">${b.label}</text>`;
    });

    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img">
      <text x="10" y="12" fill="#a7afbd" font-size="11">${axisLabel}</text>
      ${gridlines}${rects}
    </svg>`;
  }

  function page(text, settings) {
    const t = text.results;
    return {
      type: jsPsychHtmlButtonResponse,
      choices: [t.continue_button],
      stimulus: function () {
        const emo = summarizeEmotional();
        const cls = summarizeClassic();
        const { stats, negBias, posBias } = emo;

        // Persist summary into the data (also appears in CSV).
        const props = {
          summary_rt_negative:
            stats.negative.meanRT != null ? Math.round(stats.negative.meanRT) : "",
          summary_rt_positive:
            stats.positive.meanRT != null ? Math.round(stats.positive.meanRT) : "",
          summary_rt_neutral:
            stats.neutral.meanRT != null ? Math.round(stats.neutral.meanRT) : "",
          summary_bias_negative: negBias != null ? Math.round(negBias) : "",
          summary_bias_positive: posBias != null ? Math.round(posBias) : "",
        };
        if (cls) {
          props.summary_rt_congruent =
            cls.congruent.meanRT != null ? Math.round(cls.congruent.meanRT) : "";
          props.summary_rt_incongruent =
            cls.incongruent.meanRT != null ? Math.round(cls.incongruent.meanRT) : "";
          props.summary_stroop_effect =
            cls.effect != null ? Math.round(cls.effect) : "";
        }
        jsPsych.data.addProperties(props);

        const fmtRT = (v) => (v != null ? Math.round(v) : t.na);
        const fmtAcc = (v) =>
          v != null ? Math.round(v * 100) + (STROOP.lang === "en" ? "%" : "٪") : t.na;
        const fmtBias = (v) =>
          v != null ? (v > 0 ? "+" : "") + Math.round(v) : t.na;

        const rowFor = (key) => `
          <tr>
            <td>${t.labels[key]}</td>
            <td>${fmtRT(stats[key].meanRT)}</td>
            <td>${fmtAcc(stats[key].accuracy)}</td>
          </tr>`;

        // Bar chart for emotional categories.
        const chart = svgBarChart(
          [
            { label: t.labels.negative, value: stats.negative.meanRT, color: "#e23b3b" },
            { label: t.labels.positive, value: stats.positive.meanRT, color: "#2fae5a" },
            { label: t.labels.neutral, value: stats.neutral.meanRT, color: "#2f6fd6" },
          ],
          t.chart_rt_axis
        );

        // Classic (congruency) section.
        let classicSection = "";
        if (cls) {
          const stroopHigh = cls.effect != null && cls.effect > BIAS_THRESHOLD_MS;
          classicSection = `
            <h3 style="margin-top:24px">${t.congruency_heading}</h3>
            <div class="table-wrapper">
              <table class="results-table">
                <thead><tr>
                  <th>${t.table.category}</th>
                  <th>${t.table.meanrt}</th>
                  <th>${t.table.acc}</th>
                </tr></thead>
                <tbody>
                  <tr><td>${t.congruency_congruent}</td><td>${fmtRT(cls.congruent.meanRT)}</td><td>${fmtAcc(cls.congruent.accuracy)}</td></tr>
                  <tr><td>${t.congruency_incongruent}</td><td>${fmtRT(cls.incongruent.meanRT)}</td><td>${fmtAcc(cls.incongruent.accuracy)}</td></tr>
                </tbody>
              </table>
            </div>
            <ul class="stroop-list">
              <li>${t.congruency_effect_label}: <b>${fmtBias(cls.effect)}</b> ${t.bias_unit}</li>
            </ul>
            <p>${stroopHigh ? t.interp_stroop_effect : t.interp_stroop_none}</p>`;
        }

        return `
          <div class="stroop-card">
            <h2>${t.heading}</h2>
            <p class="muted">${t.intro}</p>
            <div class="table-wrapper">
              <table class="results-table">
                <thead><tr>
                  <th>${t.table.category}</th>
                  <th>${t.table.meanrt}</th>
                  <th>${t.table.acc}</th>
                </tr></thead>
                <tbody>${rowFor("negative")}${rowFor("positive")}${rowFor("neutral")}</tbody>
              </table>
            </div>

            <h3 style="margin-top:22px">${t.chart_heading}</h3>
            <div class="chart-box">${chart}</div>

            <h3 style="margin-top:22px">${t.bias_heading}</h3>
            <ul class="stroop-list">
              <li>${t.bias_negative_label}: <b>${fmtBias(negBias)}</b> ${t.bias_unit}</li>
              <li>${t.bias_positive_label}: <b>${fmtBias(posBias)}</b> ${t.bias_unit}</li>
            </ul>

            <h3 style="margin-top:22px">${t.interp_heading}</h3>
            <p>${interpretEmotional(text, negBias, posBias)}</p>

            ${classicSection}

            <p class="muted" style="font-size:14px;margin-top:18px">${t.disclaimer}</p>
          </div>`;
      },
      data: { task: "results_summary" },
    };
  }

  return { summarizeEmotional, summarizeClassic, page };
})();
