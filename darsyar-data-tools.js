/* Full-site localStorage backup, restore, and clear tools for MathMate. */
(function () {
  'use strict';

  const downloadButton = document.getElementById('darsyarBackupDownload');
  const restoreButton = document.getElementById('darsyarBackupRestore');
  const fileInput = document.getElementById('darsyarBackupFile');
  const backupStatus = document.getElementById('darsyarBackupStatus');
  const clearButton = document.getElementById('darsyarClearAllData');
  const clearStatus = document.getElementById('darsyarClearStatus');

  if (!downloadButton || !restoreButton || !fileInput || !backupStatus || !clearButton || !clearStatus) return;

  const FORMAT = 'mathmate-full-site-backup';
  const VERSION = 1;
  
  const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

  function mmConfirm(message) {
    return new Promise((resolve) => {
      try {
        if (!document.body || typeof document.createElement !== 'function') {
          resolve(window.confirm(message));
          return;
        }
        const overlay = document.createElement('div');
        overlay.className = 'mm-confirm-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        const okLabel = isEnglish() ? 'OK' : 'تأیید';
        const cancelLabel = isEnglish() ? 'Cancel' : 'لغو';
        overlay.innerHTML = '<div class="mm-confirm-dialog"><p></p><div class="mm-confirm-actions"><button type="button" class="mm-confirm-cancel"></button><button type="button" class="mm-confirm-ok"></button></div></div>';
        overlay.querySelector('p').textContent = message;
        overlay.querySelector('.mm-confirm-ok').textContent = okLabel;
        overlay.querySelector('.mm-confirm-cancel').textContent = cancelLabel;
        const finish = (value) => { try { overlay.remove(); } catch (_) {} resolve(value); };
        overlay.querySelector('.mm-confirm-ok').addEventListener('click', () => finish(true));
        overlay.querySelector('.mm-confirm-cancel').addEventListener('click', () => finish(false));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(false); });
        document.body.appendChild(overlay);
        try { overlay.querySelector('.mm-confirm-ok').focus(); } catch (_) {}
      } catch (_) {
        resolve(window.confirm(message));
      }
    });
  }

  function autoClearStatus(element, ms) {
    if (!element) return;
    try {
      if (typeof clearTimeout === 'function' && element._autoClear) clearTimeout(element._autoClear);
    } catch (_) {}
    try {
      element._autoClear = (typeof setTimeout === 'function' ? setTimeout : function(fn){ fn(); return 0; })(() => {
        element.textContent = '';
        delete element.dataset.state;
      }, ms || 3000);
    } catch (_) {}
  }


  function isEnglish() {
    try {
      return document.documentElement.lang === 'en' || localStorage.getItem('mathmateLang') === 'en';
    } catch (_) {
      return document.documentElement.lang === 'en';
    }
  }

  function message(fa, en) { return isEnglish() ? en : fa; }

  function setStatus(element, text, state) {
    element.textContent = text;
    if (state) element.dataset.state = state;
    else delete element.dataset.state;
    if (text) autoClearStatus(element, 3000);
  }

  function readStorageEntries() {
    const entries = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key === null) continue;
      const value = localStorage.getItem(key);
      if (value !== null) entries.push({ key, value });
    }
    entries.sort((a, b) => a.key.localeCompare(b.key));
    return entries;
  }

  function makeBackup() {
    return {
      format: FORMAT,
      version: VERSION,
      app: 'MathMate',
      createdAt: new Date().toISOString(),
      storage: readStorageEntries()
    };
  }

  function validateBackup(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error(message('ساختار فایل JSON معتبر نیست.', 'The JSON file has an invalid structure.'));
    }
    if (candidate.format !== FORMAT || candidate.version !== VERSION || !Array.isArray(candidate.storage)) {
      throw new Error(message('این فایل، پشتیبان سازگار MathMate نیست.', 'This is not a compatible MathMate backup.'));
    }
    if (candidate.storage.length > 100000) {
      throw new Error(message('تعداد داده‌های فایل بیش از حد مجاز است.', 'The backup contains too many entries.'));
    }
    const keys = new Set();
    return candidate.storage.map((entry) => {
      if (!entry || typeof entry !== 'object' || typeof entry.key !== 'string' || typeof entry.value !== 'string') {
        throw new Error(message('یکی از داده‌های پشتیبان معتبر نیست.', 'A backup entry is invalid.'));
      }
      if (keys.has(entry.key)) throw new Error(message('در فایل پشتیبان کلید تکراری وجود دارد.', 'The backup contains a duplicate storage key.'));
      keys.add(entry.key);
      return { key: entry.key, value: entry.value };
    });
  }

  function replaceStorage(entries) {
    const before = readStorageEntries();
    try {
      localStorage.clear();
      entries.forEach(({ key, value }) => localStorage.setItem(key, value));
    } catch (error) {
      try {
        localStorage.clear();
        before.forEach(({ key, value }) => localStorage.setItem(key, value));
      } catch (_) {
        throw new Error(message(
          'ذخیره‌سازی ناموفق بود و بازگرداندن کامل داده‌های قبلی نیز تضمین‌شدنی نیست. فضای ذخیره‌سازی مرورگر را بررسی کن.',
          'Storage failed; a full rollback of the previous data could not be guaranteed. Check browser storage capacity.'
        ));
      }
      throw new Error(message(
        'فضای ذخیره‌سازی برای بازیابی کافی نیست؛ داده‌های قبلی بازگردانده شدند.',
        'There is not enough browser storage to restore this backup; the previous data was restored.'
      ));
    }
  }

  function reloadAfterSuccess() {
    window.setTimeout(() => window.location.reload(), 450);
  }

  downloadButton.addEventListener('click', () => {
    try {
      const backup = makeBackup();
      const json = JSON.stringify(backup, null, 2);
      if (json.length > MAX_BACKUP_BYTES) {
        throw new Error(message('حجم پشتیبان از حد مجاز این ابزار بیشتر است.', 'The backup is larger than this tool allows.'));
      }
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      anchor.href = url;
      anchor.download = `MathMate-backup-${date}.json`;
      anchor.hidden = true;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus(backupStatus, message(
        `پشتیبان ساخته شد؛ ${backup.storage.length} مورد ذخیره‌سازی در فایل JSON قرار گرفت.`,
        `Backup created; ${backup.storage.length} storage entries were written to the JSON file.`
      ), 'success');
    } catch (error) {
      setStatus(backupStatus, error && error.message ? error.message : message('ساخت پشتیبان ناموفق بود.', 'Could not create the backup.'), 'error');
    }
  });

  restoreButton.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setStatus(backupStatus, message('حجم فایل بیش از ۲۵ مگابایت است.', 'The file is larger than 25 MB.'), 'error');
      fileInput.value = '';
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const entries = validateBackup(parsed);
      const confirmed = await mmConfirm(message(
        `بازیابی پشتیبان، داده‌های فعلی این سایت را با ${entries.length} مورد موجود در فایل جایگزین می‌کند. پیش از ادامه مطمئن شو پشتیبان درستی انتخاب کرده‌ای. ادامه می‌دهی؟`,
        `Restoring this backup will replace the site's current data with ${entries.length} entries from the file. Make sure this is the correct backup before continuing. Continue?`
      ));
      if (!confirmed) {
        setStatus(backupStatus, message('بازیابی لغو شد؛ اطلاعات فعلی تغییری نکرد.', 'Restore cancelled; current data was not changed.'), '');
        return;
      }
      replaceStorage(entries);
      setStatus(backupStatus, message('بازیابی موفق بود؛ سایت برای بارگذاری اطلاعات بازیابی‌شده دوباره باز می‌شود.', 'Restore succeeded; the site will reload to apply the restored data.'), 'success');
      reloadAfterSuccess();
    } catch (error) {
      setStatus(backupStatus, error && error.message ? error.message : message('فایل پشتیبان خوانده یا بازیابی نشد.', 'The backup file could not be read or restored.'), 'error');
    } finally {
      fileInput.value = '';
    }
  });

  clearButton.addEventListener('click', async () => {
    const confirmed = await mmConfirm(message(
      'همهٔ اطلاعات ذخیره‌شدهٔ سایت پاک می‌شود و این کار قابل بازگشت نیست. حالت روشن/تاریک فعلی حفظ می‌شود. پیش از ادامه پشتیبان بگیر. آیا مطمئنی؟',
      'All saved site data will be deleted and this cannot be undone. The current light/dark mode will be preserved. Create a backup before continuing. Are you sure?'
    ));
    if (!confirmed) {
      setStatus(clearStatus, message('عملیات لغو شد؛ اطلاعاتی حذف نشد.', 'Operation cancelled; no data was deleted.'), '');
      return;
    }
    try {
      const before = readStorageEntries();
      const mode = document.body.classList.contains('dark') || localStorage.getItem('mathmateTheme') === 'dark' ? 'dark' : 'light';
      try {
        localStorage.clear();
        localStorage.setItem('mathmateTheme', mode);
        localStorage.setItem('mmArcadeTheme', mode);
      } catch (error) {
        try {
          localStorage.clear();
          before.forEach(({ key, value }) => localStorage.setItem(key, value));
        } catch (_) {
          throw new Error(message('پاک‌سازی ناموفق بود و بازگرداندن کامل اطلاعات قبلی ممکن نیست.', 'Clear failed and a complete rollback could not be guaranteed.'));
        }
        throw new Error(message('پاک‌سازی کامل نشد؛ داده‌های قبلی بازگردانده شدند.', 'Data could not be fully cleared; the previous data was restored.'));
      }
      setStatus(clearStatus, message('اطلاعات سایت پاک شد؛ حالت روشن/تاریک حفظ شده است.', 'Site data was cleared; light/dark mode was preserved.'), 'success');
      reloadAfterSuccess();
    } catch (error) {
      setStatus(clearStatus, error && error.message ? error.message : message('پاک‌کردن اطلاعات ناموفق بود.', 'Could not clear site data.'), 'error');
    }
  });
})();
