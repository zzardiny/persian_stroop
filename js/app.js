/* ==========================================================================
   app.js
   Entry point. Loads configuration, optionally shows a language chooser,
   then starts the experiment. Shows a friendly error if config can't load.
   ========================================================================== */

(function () {
  function showError(err) {
    const target = document.getElementById("jspsych-target") || document.body;
    target.innerHTML = `
      <div class="stroop-card" style="max-width:640px;margin:60px auto;text-align:center">
        <h2 style="color:#e23b3b">خطا در بارگذاری آزمون / Loading error</h2>
        <p>فایل‌های پیکربندی بارگذاری نشدند. · Configuration files could not be loaded.</p>
        <p class="muted">اگر فایل را مستقیماً از روی دیسک باز کرده‌اید، آن را از طریق یک
        وب‌سرور (مثلاً GitHub Pages یا <code>python -m http.server</code>) اجرا کنید.</p>
        <pre style="color:#a7afbd;white-space:pre-wrap;text-align:left;direction:ltr">${
          err && err.message ? err.message : err
        }</pre>
      </div>`;
    console.error(err);
  }

  /** Render a simple two-button language chooser; resolves with "fa"|"en". */
  function chooseLanguage(config) {
    return new Promise(function (resolve) {
      const allow = config.settings.language && config.settings.language.allow_switch;
      const def =
        (config.settings.language && config.settings.language.default) || "fa";
      if (!allow) {
        resolve(def);
        return;
      }
      const target = document.getElementById("jspsych-target");
      target.innerHTML = `
        <div class="stroop-card lang-card" style="text-align:center;max-width:520px;margin:60px auto">
          <h2>زبان را انتخاب کنید · Choose language</h2>
          <div class="lang-buttons">
            <button class="stroop-btn" id="lang-fa">فارسی</button>
            <button class="stroop-btn secondary" id="lang-en">English</button>
          </div>
        </div>`;
      document.getElementById("lang-fa").addEventListener("click", function () {
        resolve("fa");
      });
      document.getElementById("lang-en").addEventListener("click", function () {
        resolve("en");
      });
    });
  }

  async function main() {
    try {
      const config = await STROOP.loadConfigs();

      if (config.settings.display) {
        document.documentElement.style.setProperty(
          "--bg",
          config.settings.display.background_color || "#0f1115"
        );
        document.documentElement.style.setProperty(
          "--text",
          config.settings.display.text_color || "#f2f4f8"
        );
      }
      document.title = config.settings.experiment.title;

      const lang = await chooseLanguage(config);
      STROOP.experiment.run(config, lang);
    } catch (err) {
      showError(err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
