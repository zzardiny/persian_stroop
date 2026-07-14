# Persian Emotional Stroop Test · آزمون استروپ هیجانی فارسی

A complete, browser-based **Emotional Stroop Test** in Persian, built with
[jsPsych 8](https://www.jspsych.org/). The interface is fully **right-to-left (RTL)**
and uses the **Vazirmatn** font. It is ready to deploy on **GitHub Pages** with no
build step, and every aspect of the experiment is driven by editable **JSON config files**.

In the Emotional Stroop task the participant sees a word printed in one of four
colors and must respond to the **color of the font** (via the keyboard), while
ignoring the **meaning** of the word. Differences in reaction time between
emotional (negative), positive, and neutral words index attentional bias.

---

## ✨ Features

- **jsPsych 8** (loaded from CDN — no build tooling required)
- **RTL Persian** interface with the bundled **Vazirmatn** web font (self-contained, offline-capable)
- **🌐 Bilingual (Persian / English)** — a language chooser at the start switches all text and page direction (RTL/LTR)
- **Participant information** page (code, age, gender, handedness, education)
- **Informed-consent** page with a required agreement checkbox
- **Practice trials** with on-screen feedback
- **Main experiment** without feedback
- Three word categories: **Emotional/negative**, **Positive**, and **Neutral**
- **🧑‍🤝‍🧑 Classic color-word Stroop block** (congruent vs. incongruent) in addition to the emotional block
- **🔀 Counterbalancing** — participants are assigned to a key→color mapping group (via localStorage counter, random, or `?group=N` URL override)
- **Randomized** trial order with **color-balanced** stimulus generation
- **Accurate reaction-time** recording (jsPsych high-resolution timer)
- **Fullscreen** mode for the trial phase
- **Keyboard responses** on **F, G, H, J** (mapped to four colors)
- **📊 On-screen results summary** — per-category mean RT & accuracy, emotional-bias indices, a **bar chart**, the classic **Stroop effect**, and a short interpretation
- **CSV export** with a **UTF-8 BOM** so Persian text opens correctly in Excel (automatic + manual button)
- **☁️ Optional remote save** — POST the data (CSV or JSON) to a configurable endpoint
- Fully **configurable via JSON** (timing, keys, colors, words, blocks, counterbalancing, all UI text)
- **Modular architecture** (separate, documented JS modules)
- Includes a progress bar and a persistent on-screen key reminder during trials

---

## 📁 Project structure

```
persian_stroop/
├── index.html              # Entry point — loads jsPsych, plugins and modules
├── css/
│   └── styles.css          # RTL dark theme + Vazirmatn @font-face
├── js/
│   ├── config-loader.js    # Loads the JSON config files (fetch)
│   ├── utils.js            # Shuffling, color/key mapping, counterbalancing, stimulus generation
│   ├── pages.js            # Welcome / info / consent / instructions / end pages
│   ├── trials.js           # Fixation → stimulus → feedback/ITI trial builders
│   ├── results.js          # Results summary, bar chart & interpretation
│   ├── experiment.js       # Language, timeline assembly, fullscreen, data tagging, CSV/remote export
│   └── app.js              # Entry: loads config, language chooser, then starts the experiment
├── config/
│   ├── settings.json       # Timing, keys, colors, blocks, counterbalancing, display, data options
│   ├── words.json          # Word lists per category + practice words
│   ├── text.json           # All Persian UI strings
│   └── text_en.json        # All English UI strings
├── assets/
│   ├── Vazirmatn-Regular.woff2
│   └── Vazirmatn-Bold.woff2
├── .nojekyll               # Tells GitHub Pages to serve files as-is
└── README.md
```

---

## 🚀 Running locally

Because the app loads its configuration with `fetch()`, it must be served over
**HTTP** — opening `index.html` directly from disk (`file://`) will not work.

```bash
# from inside the persian_stroop/ folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Any static server works (`npx serve`, VS Code Live Server, etc.).

---

## 🌐 Deploying to GitHub Pages

1. Create a new GitHub repository and push the **contents of `persian_stroop/`**
   to it (so that `index.html` is at the repository root).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder, then **Save**.
5. After a minute your test will be live at
   `https://<username>.github.io/<repository>/`.

The included `.nojekyll` file ensures GitHub Pages serves every file (including
the `js/`, `css/`, `config/` and `assets/` folders) without Jekyll processing.

> **Tip:** jsPsych and its plugins are loaded from the unpkg CDN, so the
> deployed page needs internet access. The Vazirmatn font is bundled locally,
> so the Persian typography always renders correctly.

---

## ⚙️ Configuration

All behavior lives in the three JSON files under `config/` — no code editing needed.

### `config/settings.json`

| Key | Meaning |
| --- | --- |
| `timing.fixation_duration_ms` | Base fixation-cross duration |
| `timing.fixation_jitter_ms` | Random extra time added to fixation (0–jitter) |
| `timing.response_window_ms` | Max time allowed to respond |
| `timing.inter_trial_interval_ms` | Blank gap between trials (main block) |
| `timing.feedback_duration_ms` | How long practice feedback is shown |
| `trials.practice_repetitions` | How many times each practice word is shown |
| `trials.main_repetitions` | How many times each main word is shown |
| `trials.randomize` | Shuffle trial order within a block |
| `trials.show_practice_feedback` | Feedback during practice (default `true`) |
| `trials.show_main_feedback` | Feedback during main block (default `false`) |
| `response.keys` | The four response keys (default `f, g, h, j`) |
| `response.allow_uppercase` | Accept uppercase key presses too |
| `colors` | The four colors with `hex` and Persian `label_fa` |
| `key_color_map` | Which key maps to which color |
| `display.fullscreen` | Enter fullscreen for the trials |
| `display.stimulus_font_size_px` | Word size on screen |
| `data.auto_download_csv` | Auto-download CSV when the test ends |
| `data.filename_prefix` | Prefix for the exported CSV filename |
| `data.save_url` | Optional endpoint to POST the data to (empty = download only) |
| `data.save_method` | HTTP method for remote save (default `POST`) |
| `data.save_format` | `csv` or `json` for the remote save payload |
| `blocks.emotional` | Run the emotional-Stroop block |
| `blocks.classic` | Run the classic color-word Stroop block |
| `classic.repetitions` | Repetitions of each color in the classic block |
| `classic.congruent_ratio` | Proportion of congruent trials (0–1) in the classic block |
| `counterbalance.enabled` | Assign participants to a key→color mapping group |
| `counterbalance.method` | `localstorage` (rotating counter) or `random` |
| `counterbalance.mappings` | List of key→color mappings (one per group) |
| `language.default` | Default language (`fa` or `en`) |
| `language.allow_switch` | Show the language chooser at the start |

> **Changing the number of response keys/colors:** add or remove entries in
> both `colors` and `key_color_map` consistently, and update `response.keys`.
> The stimulus generator automatically balances whatever colors you define.

### 🔀 Counterbalancing

When `counterbalance.enabled` is `true`, each participant is assigned to one of
the `mappings` groups, which sets the key→color mapping for that session. With
`method: "localstorage"` the group rotates across sessions on the same device;
with `"random"` it is chosen at random. You can force a group by opening the
page with `?group=2` (1-based). The assigned group is saved in the `cb_group`
data column.

### 🌐 Language

Set `language.default` to `fa` or `en`. When `language.allow_switch` is `true`,
participants pick the language on the first screen; the interface text and page
direction (RTL/LTR) update accordingly. All English strings live in
`config/text_en.json`.

### ☁️ Remote data saving (optional)

Leave `data.save_url` empty to only download the CSV locally. To also send data
to a server, set `data.save_url` to an endpoint that accepts a POST body. Two
common zero-backend options:

- **Google Apps Script Web App** — publish a script that appends the request
  body to a Google Sheet, and paste its `/exec` URL here.
- **[jsPsych DataPipe](https://pipe.jspsych.org/)** — a free service that saves
  to the OSF; use its experiment endpoint.

Set `data.save_format` to `csv` or `json`. Remote save failures are logged to
the console and never block the local download.

### `config/words.json`

Edit the Persian word lists under `categories.negative`, `categories.positive`
and `categories.neutral`, plus the `practice_words` array. Keep the three
categories balanced in length for a well-controlled design.

### `config/text.json`

Every visible string (titles, instructions, buttons, consent text, feedback
labels) is here, so you can adapt wording or translate the interface without
touching any JavaScript.

---

## 📊 Data output (CSV columns)

Each response trial (`task = "stroop"`) records, among others:

| Column | Description |
| --- | --- |
| `participant_code`, `age`, `gender`, `handedness`, `education` | Participant metadata |
| `language` | `fa` or `en` |
| `cb_group` | Counterbalancing group (1-based) |
| `block` | `practice`, `main`, or `classic` |
| `task_type` | `emotional` or `classic` |
| `word` | The word shown |
| `category` | `negative`/`positive`/`neutral` (emotional) or `congruent`/`incongruent` (classic) |
| `congruency` | `congruent`/`incongruent` for classic trials, `na` otherwise |
| `color` | The font color id (`red`/`green`/`blue`/`yellow`) |
| `color_label` | Color name in the chosen language |
| `correct_response` | The key that was correct for this trial |
| `response_key` | The key the participant pressed (lowercased) |
| `correct` | `true`/`false` accuracy |
| `responded` | Whether any key was pressed within the window |
| `rt` | Reaction time in milliseconds |
| `repetition` | Which repetition of the word this was |
| `summary_rt_*`, `summary_bias_*`, `summary_stroop_effect` | End-of-test summary values (repeated on every row) |

You can filter to the analysis rows with `block = main` (emotional) or
`task_type = classic` (classic Stroop), and `task = stroop`.

---

## 🧩 How it fits together

`app.js` loads the config files, shows the language chooser, then calls
`experiment.js`, which builds the jsPsych timeline in this order:

1. **Preload** → 2. **Welcome** → 3. **Participant info** → 4. **Consent** →
5. **Enter fullscreen** → 6. **Instructions** → 7. **Emotional practice** (with feedback) →
8. **Bridge screen** → 9. **Emotional main block** → 10. **Classic Stroop block** →
11. **Exit fullscreen** → 12. **Results summary + chart** → 13. **End screen + CSV download**.

Blocks 7–9 and 10 are toggled by `settings.blocks`. Trial construction
(`trials.js`) repeats the sequence **fixation → stimulus → feedback/ITI** for
every stimulus produced by `utils.buildStimuli()` / `utils.buildClassicStimuli()`.

---

## 📝 License

Released under the **MIT License** — free to use, modify and adapt for research
and teaching. Please cite jsPsych in any resulting publications:

> de Leeuw, J. R., Gilbert, R. A., & Luchterhandt, B. (2023). jsPsych: Enabling
> an open-source collaborative ecosystem of behavioral experiments. *Journal of
> Open Source Software.*

---

## 🙏 Acknowledgements

- [jsPsych](https://www.jspsych.org/) by Josh de Leeuw and contributors
- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) font by Saber Rastikerdar
