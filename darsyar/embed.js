/* MathMate Darsyar bootloader — same-page open Shadow DOM, never an iframe. */
(function bootMathMateDarsyar() {
  'use strict';
  const mount = document.getElementById('darsyarMount');
  if (!mount) return;

  let shadow = mount.shadowRoot;
  if (!shadow) shadow = mount.attachShadow({ mode: 'open' });

  if (!shadow.querySelector('link[data-darsyar-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'darsyar/styles.css';
    stylesheet.dataset.darsyarStyles = 'true';
    shadow.appendChild(stylesheet);
  }

  let app = shadow.querySelector('.darsyar-app');
  if (!app) {
    app = document.createElement('div');
    app.className = 'darsyar-app';
    app.setAttribute('dir', document.documentElement.dir || 'rtl');
    app.setAttribute('lang', document.documentElement.lang || 'fa');
    app.dataset.theme = 'instagram';
    app.dataset.mode = 'light';
    app.dataset.fontSize = 'normal';
    app.dataset.animations = 'on';
    app.innerHTML = `
      <section class="ds-boot-error" role="status" aria-live="polite">
        <div class="ds-boot-icon" aria-hidden="true">📚</div>
        <h2>درس‌یار در حال آماده‌سازی است</h2>
        <p>اگر این پیام باقی ماند، بارگذاری فایل‌های درس‌یار کامل نشده است.</p>
        <button type="button" data-ds-retry>تلاش دوباره</button>
      </section>`;
    shadow.appendChild(app);
  }

  shadow.addEventListener('click', event => {
    if (event.target.closest?.('[data-ds-retry]')) window.location.reload();
  });

  const state = window.__mathMateDarsyarHost || {};
  state.mount = mount;
  state.shadow = shadow;
  state.app = app;
  state.markReady = function markReady() {
    app.dataset.darsyarReady = 'true';
    app.querySelector('.ds-boot-error')?.remove();
  };
  window.__mathMateDarsyarHost = state;

  // Never leave a silent empty area if the controller fails to load.
  if (!app.__dsWatchdog) {
    app.__dsWatchdog = window.setTimeout(() => {
      if (app.dataset.darsyarReady === 'true') return;
      const message = app.querySelector('.ds-boot-error');
      if (message) {
        message.querySelector('h2').textContent = 'درس‌یار بارگذاری نشد';
        message.querySelector('p').textContent = 'فایل darsyar/embed-app.js را بررسی کن و صفحه را دوباره بارگذاری کن.';
      }
    }, 1800);
  }
})();
