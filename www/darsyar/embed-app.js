/* MathMate Darsyar controller — offline-first, storage-safe, no iframe. */
(function initMathMateDarsyarApp() {
  'use strict';
  const mount = document.getElementById('darsyarMount');
  if (!mount) return;

  const start = () => {
    const hostState = window.__mathMateDarsyarHost;
    const shadow = mount.shadowRoot;
    const app = hostState?.app || shadow?.querySelector('.darsyar-app');
    if (!shadow || !app || app.dataset.controllerReady === 'true') return;
    app.dataset.controllerReady = 'true';

    const read = (key, fallback) => {
      try { const value = localStorage.getItem(key); return value == null ? fallback : value; }
      catch { return fallback; }
    };
    const write = (key, value) => {
      try { localStorage.setItem(key, value); return true; }
      catch { toast(state.lang === 'fa' ? 'ذخیره‌سازی در این مرورگر در دسترس نیست.' : 'Storage is not available in this browser.'); return false; }
    };
    const readJSON = (key, fallback) => {
      try { const value = JSON.parse(read(key, '')); return value == null ? fallback : value; }
      catch { return fallback; }
    };
    const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const icons = {
      cap: '<path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 11.2v4.3c3.1 2.2 6.9 2.2 10 0v-4.3M21 9v6"/>',
      home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>',
      task: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="m8 10 2 2 5-5M8 16h8"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1.1 1.1.9-1.3 2.2-1.4-.6a7.5 7.5 0 0 1-1.8 1l-.2 1.5h-2.6l-.3-1.5a7.5 7.5 0 0 1-1.8-1l-1.4.6-1.3-2.2 1.1-.9a7 7 0 0 1 0-2.1l-1.1-.9 1.3-2.2 1.4.6a7.5 7.5 0 0 1 1.8-1l.3-1.5h2.6l.2 1.5a7.5 7.5 0 0 1 1.8 1l1.4-.6 1.3 2.2-1.1.9a7 7 0 0 1-.1 2Z"/>',
      search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      left: '<path d="m14 5-7 7 7 7"/>',
      right: '<path d="m10 5 7 7-7 7"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7M8 10h7"/>',
      note: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
      spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>'
    };
    const resolveAsset = (rel) => {
      try {
        // Always resolve against the host document so Shadow DOM img/src works with ./assets/...
        return new URL(String(rel || '').replace(/^\//, ''), document.baseURI || window.location.href).href;
      } catch (_) {
        return rel;
      }
    };
    const assetIcon = (file, cls = '') => `<img class="ds-icon ds-asset-icon ${cls}" src="${resolveAsset('assets/icons/' + file)}" alt="" width="20" height="20" aria-hidden="true">`;
    const icon = (name, cls = '') => {
      const map = { book: 'book.svg', note: 'note.svg', trash: 'trash.svg', search: 'search.svg', settings: 'settings.svg', home: 'home.svg', image: 'photo.svg', clock: 'time.svg', calendar: 'date.svg', edit: 'edit.svg' };
      if (map[name]) return assetIcon(map[name], cls);
      return `<svg class="ds-icon ds-icon-${name} ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
    };
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const validDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
    const isValidDateKey = (value) => { if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return false;const [y,m,d]=String(value).split('-').map(Number);const date=new Date(y,m-1,d,12);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d; };
    const parseDate = (value) => { if(!isValidDateKey(value)) return new Date(today); const [y,m,d]=String(value).split('-').map(Number); return new Date(y,m-1,d,12); };
    const addDays = (d, amount) => { const next = new Date(d); next.setDate(next.getDate() + amount); next.setHours(12,0,0,0); return next; };
    const state = {
      lang: (localStorage.getItem('mathmateLang') === 'en' || document.documentElement.lang === 'en') ? 'en' : 'fa',
      theme: 'light', colorTheme: 'instagram', fontSize: 'normal', animations: true,
      view: 'dashboard', tasks: readJSON('mathmateDarsyarTasks', []), notesList: (function(){ const raw=readJSON('mathmateDarsyarNotesList', null); if(Array.isArray(raw)) return raw.map((note,index)=>note&&typeof note==='object'?{...note,id:String(note.id||`legacy-note-${index}`)}:note); const legacy=read('mathmateDarsyarNotes',''); if(legacy&&legacy.trim()) return [{id:'legacy-1',title:(document.documentElement.lang==='en'?'My note':'یادداشت من'),body:legacy,createdAt:Date.now(),updatedAt:Date.now()}]; return []; })(),
      calendarCursor: new Date(today), selectedDate: new Date(today), taskFilter: 'all', searchText: '',
      focusMinutes: Math.max(1, Math.min(180, Number(read('mathmateDarsyarFocusMin','25'))||25)), focusSeconds: 0, focusRunning: false, focusInterval: null, editingNoteId: null,
      draftAvatar: read('mathmateAvatar', ''), customAvatar: '',
      profileName: read('mathmateName', '').slice(0,50),
      toastTimer: null
    };
    if (!Array.isArray(state.tasks)) state.tasks = [];
    state.tasks = state.tasks.filter(task => task && typeof task === 'object' && typeof task.title === 'string').map((task,index) => ({
      id: String(task.id || `legacy-task-${index}`),
      title: task.title.slice(0,180), subject: String(task.subject || '').slice(0,80), dueDate: isValidDateKey(task.dueDate) ? task.dueDate : dateKey(today),
      priority: ['low','medium','high'].includes(task.priority) ? task.priority : 'medium', done: Boolean(task.done), createdAt: Number(task.createdAt) || Date.now()
    }));
    state.draftAvatar ||= makeAvatar('🎓', '#7c5ce7');

    app.innerHTML = `
      <div class="ds-shell" id="dsShell">
        <header class="ds-topbar">
          <div class="ds-brand">
            <div class="ds-brand-mark">${icon('cap')}</div>
            <div><div class="ds-brand-title" data-fa="درس‌یار" data-en="Study Planner">درس‌یار</div><div class="ds-brand-subtitle" data-fa="برنامه‌ریز مطالعه و تکلیف‌ها" data-en="Study and homework planner">برنامه‌ریز مطالعه و تکلیف‌ها</div></div>
          </div>
          <div class="ds-search-area">
            <button type="button" class="ds-search-toggle" id="dsSearchToggle" aria-label="جست‌وجو" title="جست‌وجو" aria-expanded="false">${icon('search')}</button>
            <div class="ds-search-wrap" id="dsSearchWrap">
              <label class="ds-screen-reader" for="dsSearchInput" data-fa="جست‌وجو در درس‌یار" data-en="Search Study Planner">جست‌وجو در درس‌یار</label>
              <input class="ds-search-input" type="search" id="dsSearchInput" placeholder="جست‌وجو در تکلیف‌ها، درس‌ها و یادداشت‌ها..." data-placeholder-fa="جست‌وجو در تکلیف‌ها، درس‌ها و یادداشت‌ها..." data-placeholder-en="Search tasks, subjects and notes..." autocomplete="off">
            </div>
          </div>
          <button type="button" class="ds-profile-shortcut" id="dsProfileShortcut" aria-label="حساب کاربری" title="حساب کاربری"><img id="dsTopAvatar" alt="آواتار" src=""></button>
        </header>

        <nav class="ds-tabs" aria-label="ناوبری درس‌یار">
          <button type="button" class="ds-tab is-active" data-view="dashboard">${icon('home')}<span data-fa="پیشخوان" data-en="Overview">پیشخوان</span></button>
          <button type="button" class="ds-tab" data-view="tasks">${icon('task')}<span data-fa="تکلیف‌ها" data-en="Tasks">تکلیف‌ها</span></button>
          <button type="button" class="ds-tab" data-view="calendar">${icon('calendar')}<span data-fa="تقویم" data-en="Calendar">تقویم</span></button>
          <button type="button" class="ds-tab" data-view="notes">${icon('note')}<span data-fa="یادداشت‌ها" data-en="Notes">یادداشت‌ها</span></button>
          <button type="button" class="ds-tab" data-view="account">${icon('user')}<span data-fa="حساب من" data-en="My profile">حساب من</span></button>
          <button type="button" class="ds-tab" data-view="settings">${icon('settings')}<span data-fa="تنظیمات" data-en="Settings">تنظیمات</span></button>
        </nav>

        <section class="ds-panel is-active" data-panel="dashboard" aria-label="پیشخوان درس‌یار">
          <section class="ds-greeting-card">
            <div class="ds-greeting-copy">
              <div class="ds-eyebrow"><span data-fa="برنامهٔ امروز شما" data-en="Your plan for today">برنامهٔ امروز شما</span></div>
              <h1 class="ds-greeting-title" id="dsGreetingTitle">عصر بخیر، دوست من!</h1>
              <p class="ds-greeting-text" id="dsGreetingText">امروز فرصت تازه‌ای برای یادگیریه. با یک کار کوچک شروع کن و قدم‌به‌قدم جلو برو.</p>
              <div class="ds-live-clock" id="dsLiveClock" aria-live="polite"><span id="dsLiveClockTime">00:00:00</span><small id="dsLiveClockLabel" data-fa="ساعت · دقیقه · ثانیه" data-en="hour · min · sec">ساعت · دقیقه · ثانیه</small></div>
            </div>
            <div class="ds-greeting-visual" aria-hidden="true">${icon('book')}</div>
          </section>

          <div class="ds-summary-grid">
            <article class="ds-summary-card"><div class="ds-summary-icon">${icon('task')}</div><div><div class="ds-summary-label" data-fa="کل تکلیف‌ها" data-en="All tasks">کل تکلیف‌ها</div><div class="ds-summary-value" id="dsTotalTasks">۰</div></div></article>
            <article class="ds-summary-card"><div class="ds-summary-icon">${icon('check')}</div><div><div class="ds-summary-label" data-fa="انجام‌شده" data-en="Completed">انجام‌شده</div><div class="ds-summary-value" id="dsDoneTasks">۰</div></div></article>
            <article class="ds-summary-card"><div class="ds-summary-icon">${icon('clock')}</div><div><div class="ds-summary-label" data-fa="باقی‌مانده" data-en="Remaining">باقی‌مانده</div><div class="ds-summary-value" id="dsRemainingTasks">۰</div></div></article>
          </div>

          <div class="ds-dashboard-grid">
            <div class="ds-stack">
              <section class="ds-card">
                <div class="ds-card-header"><div><h2 class="ds-card-title" data-fa="برنامهٔ کارها" data-en="Your tasks">برنامهٔ کارها</h2><div class="ds-card-caption" id="dsTodayCaption">کارهای امروزت را از همین‌جا مدیریت کن.</div></div><button type="button" class="ds-link-button" data-action="switch-view" data-target-view="tasks" data-fa="همهٔ تکلیف‌ها ←" data-en="All tasks →">همهٔ تکلیف‌ها ←</button></div>
                <div class="ds-task-list" id="dsTodayTaskList"></div>
                <button type="button" class="ds-primary-button" style="width:100%;margin-top:13px" data-action="switch-view" data-target-view="tasks">${icon('plus')}<span data-fa="افزودن تکلیف تازه" data-en="Add a new task">افزودن تکلیف تازه</span></button>
              </section>
              <section class="ds-card">
                <div class="ds-card-header"><div><h2 class="ds-card-title" data-fa="زمان مطالعه" data-en="Study focus">زمان مطالعه</h2><div class="ds-card-caption" data-fa="یک بازهٔ کوتاه تمرکز کن و بعد کمی استراحت کن." data-en="Focus for a while, then take a short break.">یک بازهٔ کوتاه تمرکز کن و بعد کمی استراحت کن.</div></div>${icon('clock')}</div>
                <div class="ds-focus-card"><div class="ds-focus-ring-wrap"><svg class="ds-focus-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="ds-focus-ring-bg" cx="50" cy="50" r="42" fill="none" stroke-width="7"/><circle class="ds-focus-ring-progress" id="dsFocusRingProgress" cx="50" cy="50" r="42" fill="none" stroke-width="7" stroke-linecap="round" transform="rotate(-90 50 50)" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0"/></svg><div class="ds-focus-clock" id="dsFocusClock">00:25:00</div></div><div><strong data-fa="یک قدم کوچک، پیشرفت واقعی" data-en="Small steps, real progress">یک قدم کوچک، پیشرفت واقعی</strong><p class="ds-card-caption" data-fa="مدت تمرکز را با ساعت، دقیقه و ثانیه تنظیم کن." data-en="Set focus duration with hours, minutes and seconds.">مدت تمرکز را با ساعت، دقیقه و ثانیه تنظیم کن.</p><div class="ds-focus-duration" style="margin:10px 0 4px"><span class="ds-focus-duration-label" data-fa="مدت تمرکز" data-en="Focus duration">مدت تمرکز</span><div class="ds-focus-duration-fields"><div class="ds-field"><label for="dsFocusHours" data-fa="ساعت" data-en="Hours">ساعت</label><input id="dsFocusHours" type="number" min="0" max="12" step="1" inputmode="numeric" value="0"></div><div class="ds-field"><label for="dsFocusMinutes" data-fa="دقیقه" data-en="Minutes">دقیقه</label><input id="dsFocusMinutes" type="number" min="0" max="59" step="1" inputmode="numeric" value="25"></div><div class="ds-field"><label for="dsFocusSeconds" data-fa="ثانیه" data-en="Seconds">ثانیه</label><input id="dsFocusSeconds" type="number" min="0" max="59" step="1" inputmode="numeric" value="0"></div></div></div><div class="ds-focus-actions"><button type="button" class="ds-primary-button" id="dsFocusToggle">${icon('clock')}<span data-fa="شروع تمرکز" data-en="Start focus">شروع تمرکز</span></button><button type="button" class="ds-secondary-button" id="dsFocusReset" data-fa="شروع دوباره" data-en="Reset">شروع دوباره</button></div></div></div>
              </section>
            </div>
            <div class="ds-stack">
              <section class="ds-card ds-calendar-card" id="darsyarCalendarPanel">
                <div class="ds-card-header"><div><h2 class="ds-card-title" data-fa="تقویم" data-en="Calendar">تقویم</h2><div class="ds-card-caption" id="dsCalendarSubtitle">تاریخ امروز</div></div><button type="button" class="ds-link-button" data-action="switch-view" data-target-view="calendar" data-fa="نمای کامل" data-en="Full view">نمای کامل</button></div>
                <div class="ds-calendar-top-actions"><button type="button" class="ds-calendar-nav" data-action="calendar-prev" aria-label="ماه قبل">${icon('left')}</button><div class="ds-calendar-month" id="dsCalendarMonth"></div><button type="button" class="ds-calendar-nav" data-action="calendar-next" aria-label="ماه بعد">${icon('right')}</button></div>
                <div class="ds-calendar-grid" id="dsCalendarGrid" role="grid" aria-label="تقویم ماهانه"></div>
                <div class="ds-calendar-footer"><span id="dsSelectedDateLabel"></span><span id="dsSelectedDateTasks"></span></div>
              </section>
              <section class="ds-card">
                <div class="ds-card-header"><div><h2 class="ds-card-title" data-fa="یادداشت سریع" data-en="Quick note">یادداشت سریع</h2><div class="ds-card-caption" data-fa="نکته‌ای را بنویس تا فراموش نشود." data-en="Write down something you want to remember.">نکته‌ای را بنویس تا فراموش نشود.</div></div>${icon('note')}</div>
                <div class="ds-helper-text" id="dsQuickNotePreview"></div><button type="button" class="ds-secondary-button" data-action="switch-view" data-target-view="notes">${icon('note')}<span data-fa="رفتن به یادداشت‌ها" data-en="Open notes">رفتن به یادداشت‌ها</span></button>
              </section>
            </div>
          </div>
        </section>

        <section class="ds-panel" data-panel="tasks" aria-label="تکلیف‌ها">
          <div class="ds-view-heading"><h1 data-fa="تکلیف‌ها و برنامهٔ مطالعه" data-en="Tasks and study plan">تکلیف‌ها و برنامهٔ مطالعه</h1><p data-fa="کارهایت را ثبت کن، تاریخ انجام بده و پس از اتمام علامت بزن. اطلاعات روی همین دستگاه ذخیره می‌شوند." data-en="Create tasks, set due dates, and mark them complete. Your information stays on this device.">کارهایت را ثبت کن، تاریخ انجام بده و پس از اتمام علامت بزن. اطلاعات روی همین دستگاه ذخیره می‌شوند.</p></div>
          <section class="ds-card">
            <div class="ds-card-header"><div><h2 class="ds-card-title" data-fa="افزودن تکلیف" data-en="Add a task">افزودن تکلیف</h2><div class="ds-card-caption" data-fa="عنوان را وارد کن؛ بقیهٔ فیلدها اختیاری‌اند." data-en="Enter a title; the other fields are optional.">عنوان را وارد کن؛ بقیهٔ فیلدها اختیاری‌اند.</div></div>${icon('plus')}</div>
            <form class="ds-inline-form" id="dsTaskForm">
              <div class="ds-field"><label for="dsTaskTitle" data-fa="عنوان تکلیف" data-en="Task title">عنوان تکلیف</label><input id="dsTaskTitle" name="title" maxlength="180" required placeholder="مثلاً حل تمرین ریاضی" data-placeholder-fa="مثلاً حل تمرین ریاضی" data-placeholder-en="e.g. Finish math exercises"></div>
              <div class="ds-field"><label for="dsTaskSubject" data-fa="درس (اختیاری)" data-en="Subject (optional)">درس (اختیاری)</label><input id="dsTaskSubject" name="subject" maxlength="80" placeholder="مثلاً ریاضی" data-placeholder-fa="مثلاً ریاضی" data-placeholder-en="e.g. Math"></div>
              <div class="ds-field"><label for="dsTaskDueDate" data-fa="تاریخ انجام" data-en="Due date">تاریخ انجام</label><input id="dsTaskDueDate" name="dueDate" type="date" required></div>
              <div class="ds-field"><label id="dsTaskPriorityLabel" for="dsTaskPriority" data-fa="اولویت" data-en="Priority">اولویت</label>
              <div class="ds-priority-wrap" id="dsPriorityWrap">
                <select id="dsTaskPriority" name="priority" tabindex="-1" aria-hidden="true">
                  <option value="low" data-fa="کم" data-en="Low">کم</option>
                  <option value="medium" selected data-fa="معمولی" data-en="Medium">معمولی</option>
                  <option value="high" data-fa="زیاد" data-en="High">زیاد</option>
                </select>
                <button type="button" class="ds-priority-trigger" id="dsPriorityTrigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="dsTaskPriorityLabel">
                  <span class="ds-priority-value" id="dsPriorityValue">معمولی</span>
                  <svg class="ds-priority-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div class="ds-priority-menu" id="dsPriorityMenu" role="listbox">
                  <button type="button" class="ds-priority-option" role="option" data-value="low" data-fa="کم" data-en="Low">کم</button>
                  <button type="button" class="ds-priority-option is-selected" role="option" data-value="medium" data-fa="معمولی" data-en="Medium" aria-selected="true">معمولی</button>
                  <button type="button" class="ds-priority-option" role="option" data-value="high" data-fa="زیاد" data-en="High">زیاد</button>
                </div>
              </div>
            </div>
              <button type="submit" class="ds-primary-button">${icon('plus')}<span data-fa="ثبت تکلیف" data-en="Save task">ثبت تکلیف</span></button>
            </form>
            <div class="ds-card-header" style="margin-top:18px;margin-bottom:10px"><h2 class="ds-card-title" data-fa="فهرست تکلیف‌ها" data-en="Task list">فهرست تکلیف‌ها</h2><span id="dsTaskCountCaption" class="ds-card-caption"></span></div>
            <div class="ds-filter-row"><button class="ds-filter-button is-active" data-task-filter="all" data-fa="همه" data-en="All">همه</button><button class="ds-filter-button" data-task-filter="pending" data-fa="باقی‌مانده" data-en="Pending">باقی‌مانده</button><button class="ds-filter-button" data-task-filter="done" data-fa="انجام‌شده" data-en="Completed">انجام‌شده</button></div>
            <div class="ds-task-list" id="dsAllTaskList"></div>
          </section>
        </section>

        <section class="ds-panel" data-panel="calendar" aria-label="تقویم درس‌یار">
          <div class="ds-view-heading"><h1 data-fa="تقویم مطالعه" data-en="Study calendar">تقویم مطالعه</h1><p data-fa="روزهای دارای تکلیف با نقطه مشخص می‌شوند. یک روز را انتخاب کن تا تکلیف‌های آن را ببینی." data-en="Days with tasks are marked. Select a day to see its tasks.">روزهای دارای تکلیف با نقطه مشخص می‌شوند. یک روز را انتخاب کن تا تکلیف‌های آن را ببینی.</p></div>
          <section class="ds-card ds-calendar-card" id="darsyarFullCalendarPanel">
            <div class="ds-calendar-top-actions"><button type="button" class="ds-calendar-nav" data-action="calendar-prev" aria-label="ماه قبل">${icon('left')}</button><div class="ds-calendar-month" id="dsFullCalendarMonth"></div><button type="button" class="ds-calendar-nav" data-action="calendar-next" aria-label="ماه بعد">${icon('right')}</button></div>
            <div class="ds-calendar-grid" id="dsFullCalendarGrid" role="grid" aria-label="تقویم ماهانه"></div>
            <div class="ds-calendar-footer"><span id="dsFullSelectedDateLabel"></span><span id="dsFullSelectedDateTasks"></span></div>
          </section>
          <section class="ds-card" style="margin-top:18px"><div class="ds-card-header"><div><h2 class="ds-card-title" data-fa="تکلیف‌های این روز" data-en="Tasks for this day">تکلیف‌های این روز</h2><div class="ds-card-caption" id="dsDayTasksCaption"></div></div><button type="button" class="ds-link-button" data-action="switch-view" data-target-view="tasks" data-fa="مدیریت تکلیف‌ها" data-en="Manage tasks">مدیریت تکلیف‌ها</button></div><div class="ds-task-list" id="dsSelectedDayTasks"></div></section>
        </section>

        <section class="ds-panel" data-panel="notes" aria-label="یادداشت‌های درس‌یار">
          <div class="ds-view-heading"><h1 data-fa="یادداشت‌های من" data-en="My notes">یادداشت‌های من</h1><p data-fa="هر تعداد یادداشت با موضوع دلخواه اضافه کن. همه روی همین دستگاه ذخیره می‌شوند." data-en="Add as many notes as you like, each with its own title. Everything stays on this device.">هر تعداد یادداشت با موضوع دلخواه اضافه کن. همه روی همین دستگاه ذخیره می‌شوند.</p></div>
          <section class="ds-card">
            <div class="ds-card-header"><div><h2 class="ds-card-title" id="dsNoteFormTitle" data-fa="یادداشت جدید" data-en="New note">یادداشت جدید</h2><div class="ds-card-caption" data-fa="عنوان و متن را وارد کن." data-en="Enter a title and the note body.">عنوان و متن را وارد کن.</div></div>${icon('note')}</div>
            <form id="dsNoteForm" class="ds-inline-form" style="display:grid;grid-template-columns:1fr;gap:10px">
              <div class="ds-field"><label for="dsNoteTitle" data-fa="موضوع / عنوان" data-en="Title / subject">موضوع / عنوان</label><input id="dsNoteTitle" name="title" maxlength="120" required placeholder="مثلاً نکته‌های فصل سوم" data-placeholder-fa="مثلاً نکته‌های فصل سوم" data-placeholder-en="e.g. Chapter 3 tips"></div>
              <div class="ds-field">
                <label for="dsNoteBody" data-fa="متن یادداشت" data-en="Note body">متن یادداشت</label>
                <div class="ds-note-toolbar" id="dsNoteToolbar" role="toolbar" aria-label="Note formatting">
                  <button type="button" class="ds-note-tool" data-cmd="bold" title="Bold"><strong>B</strong></button>
                  <button type="button" class="ds-note-tool" data-cmd="italic" title="Italic"><em>I</em></button>
                  <button type="button" class="ds-note-tool" data-cmd="underline" title="Underline"><span style="text-decoration:underline">U</span></button>
                  <div class="ds-hl-group" id="dsHighlightGroup">
                    <button type="button" class="ds-note-tool ds-hl-main" data-cmd="highlight" title="Highlight" id="dsHighlightBtn"><span class="ds-hl-letter">H</span></button>
                    <button type="button" class="ds-note-tool ds-hl-caret" id="dsHighlightCaret" aria-haspopup="listbox" aria-expanded="false" title="Highlight color">
                      <svg class="ds-hl-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <div class="ds-hl-menu" id="dsHighlightMenu" role="listbox" hidden>
                      <button type="button" class="ds-hl-option is-selected" role="option" data-color="#ef4444" data-fa="قرمز" data-en="Red"><span class="ds-hl-dot" style="background:#ef4444"></span><span data-fa="قرمز" data-en="Red">قرمز</span></button>
                      <button type="button" class="ds-hl-option" role="option" data-color="#3b82f6" data-fa="آبی" data-en="Blue"><span class="ds-hl-dot" style="background:#3b82f6"></span><span data-fa="آبی" data-en="Blue">آبی</span></button>
                      <button type="button" class="ds-hl-option" role="option" data-color="#22c55e" data-fa="سبز" data-en="Green"><span class="ds-hl-dot" style="background:#22c55e"></span><span data-fa="سبز" data-en="Green">سبز</span></button>
                      <button type="button" class="ds-hl-option" role="option" data-color="#fde047" data-fa="زرد" data-en="Yellow"><span class="ds-hl-dot" style="background:#fde047"></span><span data-fa="زرد" data-en="Yellow">زرد</span></button>
                      <button type="button" class="ds-hl-option" role="option" data-color="#ec4899" data-fa="صورتی" data-en="Pink"><span class="ds-hl-dot" style="background:#ec4899"></span><span data-fa="صورتی" data-en="Pink">صورتی</span></button>
                      <button type="button" class="ds-hl-option" role="option" data-color="#f97316" data-fa="نارنجی" data-en="Orange"><span class="ds-hl-dot" style="background:#f97316"></span><span data-fa="نارنجی" data-en="Orange">نارنجی</span></button>
                    </div>
                  </div>
                  <button type="button" class="ds-note-tool" data-cmd="image" title="Image" id="dsNoteImageBtn"><img class="ds-note-tool-icon" src="${resolveAsset('assets/icons/photo.svg')}" alt="" width="18" height="18"></button>
                  <input type="file" id="dsNoteImageInput" accept="image/*" hidden>
                </div>
                <div id="dsNoteBody" class="ds-note-editor" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder-fa="یادداشتت را اینجا بنویس..." data-placeholder-en="Write your note here..."></div>
                <div class="ds-note-images" id="dsNoteImages" aria-label="Note images"></div>
              </div>
              <div class="ds-focus-actions"><button type="submit" class="ds-primary-button" id="dsNoteSubmit">${icon('plus')}<span data-fa="افزودن یادداشت" data-en="Add note">افزودن یادداشت</span></button><button type="button" class="ds-secondary-button" id="dsNoteCancel" hidden data-fa="انصراف" data-en="Cancel">انصراف</button></div>
            </form>
            <div class="ds-note-status" id="dsNotesStatus" aria-live="polite"></div>
          </section>
          <section class="ds-card" style="margin-top:18px">
            <div class="ds-card-header"><div><h2 class="ds-card-title" data-fa="یادداشت‌های ذخیره‌شده" data-en="Saved notes">یادداشت‌های ذخیره‌شده</h2><div class="ds-card-caption" id="dsNotesCountCaption"></div></div></div>
            <div class="ds-task-list" id="dsNotesList"></div>
          </section>
        </section>

        <section class="ds-panel" data-panel="account" aria-label="حساب درس‌یار">
          <div class="ds-view-heading"><h1 data-fa="حساب و آواتار" data-en="Profile and avatar">حساب و آواتار</h1><p data-fa="نام و آواتاری را انتخاب کن که دوست داری در صفحهٔ خوش‌آمدگویی همیار ریاضی نمایش داده شود." data-en="Choose the name and avatar you want to see in MathMate's welcome area.">نام و آواتاری را انتخاب کن که دوست داری در صفحهٔ خوش‌آمدگویی همیار ریاضی نمایش داده شود.</p></div>
          <div class="ds-account-layout">
            <section class="ds-card"><div class="ds-profile-preview"><img class="ds-avatar-preview" id="dsAvatarPreview" alt="پیش‌نمایش آواتار"><div><h2 class="ds-card-title" id="dsProfilePreviewName">دوست من</h2><div class="ds-card-caption" data-fa="پیش‌نمایش حساب شما" data-en="Your profile preview">پیش‌نمایش حساب شما</div></div></div><p class="ds-helper-text" data-fa="می‌توانی از آواتارهای پیش‌فرض استفاده کنی یا عکس خودت را از دستگاه انتخاب کنی. تصویر به‌صورت کامل و با گوشه‌های گرد نمایش داده می‌شود." data-en="Choose a default avatar or a photo from your device. The whole image is shown with rounded corners.">می‌توانی از آواتارهای پیش‌فرض استفاده کنی یا عکس خودت را از دستگاه انتخاب کنی. تصویر به‌صورت کامل و با گوشه‌های گرد نمایش داده می‌شود.</p></section>
            <section class="ds-card">
              <div class="ds-field"><label for="dsProfileName" data-fa="نام شما" data-en="Your name">نام شما</label><input id="dsProfileName" maxlength="50" placeholder="نام دلخواهت را وارد کن" data-placeholder-fa="نام دلخواهت را وارد کن" data-placeholder-en="Enter your preferred name" autocomplete="name"></div>
              <p class="ds-helper-text" data-fa="این نام روی صفحهٔ خوش‌آمدگویی همیار ریاضی نمایش داده می‌شود. پس از نوشتن نام و انتخاب آواتار، دکمهٔ «تأیید و ذخیره اطلاعات» را بزن." data-en="This name appears in MathMate's welcome message. After entering your name and choosing an avatar, select “Confirm and save profile”.">این نام روی صفحهٔ خوش‌آمدگویی همیار ریاضی نمایش داده می‌شود. پس از نوشتن نام و انتخاب آواتار، دکمهٔ «تأیید و ذخیره اطلاعات» را بزن.</p>
              <h3 class="ds-setting-title" data-fa="انتخاب آواتار" data-en="Choose an avatar">انتخاب آواتار</h3>
              <div class="ds-avatar-grid" id="dsAvatarGrid" aria-label="انتخاب آواتار"></div>
              <label class="ds-secondary-button" for="dsPhotoInput" style="width:100%;cursor:pointer">${icon('image')}<span data-fa="انتخاب عکس از دستگاه" data-en="Choose a photo from device">انتخاب عکس از دستگاه</span></label><input class="ds-screen-reader" id="dsPhotoInput" type="file" accept="image/*">
              <div class="ds-inline-status" id="dsProfileStatus" aria-live="polite"></div>
              <button type="button" class="ds-primary-button" style="width:100%" id="dsSaveProfile">${icon('check')}<span data-fa="تأیید و ذخیره اطلاعات" data-en="Confirm and save profile">تأیید و ذخیره اطلاعات</span></button>
            </section>
          </div>
        </section>

        <section class="ds-panel" data-panel="settings" aria-label="تنظیمات مشترک">
          <div class="ds-view-heading"><h1 data-fa="تنظیمات درس‌یار" data-en="Study Planner settings">تنظیمات درس‌یار</h1><p data-fa="این گزینه‌ها به تنظیمات اصلی همیار ریاضی متصل‌اند؛ تغییر آن‌ها در بخش‌های دیگر برنامه هم اعمال می‌شود." data-en="These controls use MathMate's shared settings and also affect other sections of the app.">این گزینه‌ها به تنظیمات اصلی همیار ریاضی متصل‌اند؛ تغییر آن‌ها در بخش‌های دیگر برنامه هم اعمال می‌شود.</p></div>
          <section class="ds-card">
            <div class="ds-setting-group"><h2 class="ds-setting-title" data-fa="حالت نمایش" data-en="Appearance mode">حالت نمایش</h2><div class="ds-choice-row"><button type="button" class="ds-choice" data-setting-key="theme" data-setting-value="light">☀️ <span data-fa="روشن" data-en="Light">روشن</span></button><button type="button" class="ds-choice" data-setting-key="theme" data-setting-value="dark">🌙 <span data-fa="تاریک" data-en="Dark">تاریک</span></button></div></div>
            <div class="ds-setting-group"><h2 class="ds-setting-title" data-fa="تم رنگی" data-en="Color theme">تم رنگی</h2><div class="ds-choice-row"><button type="button" class="ds-choice" data-setting-key="colorTheme" data-setting-value="instagram"><span class="ds-color-dot" style="background:linear-gradient(135deg,#fca045,#e1306c,#833ab4,#405de6)"></span><span data-fa="اینستاگرام" data-en="Instagram">اینستاگرام</span></button><button type="button" class="ds-choice" data-setting-key="colorTheme" data-setting-value="pink-purple"><span class="ds-color-dot" style="background:linear-gradient(135deg,#ec4899,#7c3aed)"></span><span data-fa="صورتی و بنفش" data-en="Pink & purple">صورتی و بنفش</span></button><button type="button" class="ds-choice" data-setting-key="colorTheme" data-setting-value="blue-purple"><span class="ds-color-dot" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6,#e879b9)"></span><span data-fa="آبی و بنفش" data-en="Blue & purple">آبی و بنفش</span></button><button type="button" class="ds-choice" data-setting-key="colorTheme" data-setting-value="gold-black"><span class="ds-color-dot" style="background:linear-gradient(135deg,#171719,#c49a27)"></span><span data-fa="طلایی و مشکی" data-en="Gold & black">طلایی و مشکی</span></button></div></div>
            <div class="ds-setting-group"><h2 class="ds-setting-title" data-fa="اندازهٔ نوشته‌ها" data-en="Text size">اندازهٔ نوشته‌ها</h2><div class="ds-choice-row"><button type="button" class="ds-choice" data-setting-key="fontSize" data-setting-value="small" data-fa="کوچک" data-en="Small">کوچک</button><button type="button" class="ds-choice" data-setting-key="fontSize" data-setting-value="normal" data-fa="معمولی" data-en="Normal">معمولی</button><button type="button" class="ds-choice" data-setting-key="fontSize" data-setting-value="large" data-fa="بزرگ" data-en="Large">بزرگ</button></div></div>
            <div class="ds-setting-group"><h2 class="ds-setting-title" data-fa="زبان برنامه" data-en="App language">زبان برنامه</h2><div class="ds-choice-row"><button type="button" class="ds-choice" data-setting-key="language" data-setting-value="fa">🇮🇷 فارسی</button><button type="button" class="ds-choice" data-setting-key="language" data-setting-value="en">🇬🇧 English</button></div></div>
            <div class="ds-setting-group"><h2 class="ds-setting-title" data-fa="حرکت و انیمیشن" data-en="Motion and animation">حرکت و انیمیشن</h2><p class="ds-setting-help" data-fa="در دستگاه‌های ضعیف می‌توانی انیمیشن‌ها را خاموش کنی." data-en="You can disable animations on lower-powered devices.">در دستگاه‌های ضعیف می‌توانی انیمیشن‌ها را خاموش کنی.</p><div class="ds-choice-row"><button type="button" class="ds-choice" data-setting-key="animations" data-setting-value="true" data-fa="روشن" data-en="On">روشن</button><button type="button" class="ds-choice" data-setting-key="animations" data-setting-value="false" data-fa="خاموش" data-en="Off">خاموش</button></div></div>
          </section>
        </section>
        <div id="dsToast" class="ds-toast" hidden role="status" aria-live="polite"></div>
      </div>`;

    const $ = (selector, context = app) => context.querySelector(selector);
    const $$ = (selector, context = app) => [...context.querySelectorAll(selector)];
    const locale = () => state.lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US-u-ca-gregory';
    const dateFormatter = (options = {}) => new Intl.DateTimeFormat(locale(), options);
    const formatDate = (date, options = { year:'numeric', month:'short', day:'numeric' }) => dateFormatter(options).format(date);
    const calendarParts = (date) => {
      const f = new Intl.DateTimeFormat('en-US-u-ca-persian', { year:'numeric', month:'numeric' });
      const p = f.formatToParts(date);
      return { year: p.find(item=>item.type==='year')?.value || '', month:p.find(item=>item.type==='month')?.value || '' };
    };
    const monthKey = (date) => { if (state.lang !== 'fa') return `${date.getFullYear()}-${date.getMonth()}`; const p = calendarParts(date); return `${p.year}-${p.month}`; };
    const sameCalendarMonth = (a,b) => monthKey(a) === monthKey(b);
    const calendarFirstDay = (ref) => { let d = new Date(ref); for(let i=0;i<35;i++){const p=addDays(d,-1);if(!sameCalendarMonth(p,ref)) break;d=p;} return d; };
    const nextCalendarMonth = (direction) => { const first = calendarFirstDay(state.calendarCursor); if(direction < 0) state.calendarCursor = addDays(first,-1); else { let d = first; for(let i=0;i<35;i++){const n=addDays(d,1);if(!sameCalendarMonth(n,first)){d=n;break;}d=n;} state.calendarCursor = d; } renderCalendars(); };
    const taskCounts = () => ({ total:state.tasks.length, done:state.tasks.filter(t=>t.done).length, remaining:state.tasks.filter(t=>!t.done).length });
    function makeAvatar(emoji, color) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#171923" stop-opacity=".9"/></linearGradient></defs><rect width="160" height="160" rx="38" fill="url(#g)"/><circle cx="118" cy="35" r="31" fill="#fff" opacity=".09"/><circle cx="24" cy="136" r="40" fill="#fff" opacity=".07"/><text x="80" y="103" text-anchor="middle" font-size="76" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${emoji}</text></svg>`;
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }
    const avatarChoices = [ ['🎓','#6c63ff'], ['🦊','#f77737'], ['🐼','#667085'], ['🐱','#ec4899'], ['🚀','#3b82f6'], ['🌻','#d5a21b'], ['🦉','#16a085'], ['🐸','#22a06b'], ['🦄','#a855f7'], ['⭐','#c49a27'] ];
    function toast(message) {
      const el = $('#dsToast'); if (!el) return;
      el.textContent = message; el.hidden = false;
      if (state.toastTimer) clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => { el.hidden = true; }, 2500);
    }
    function persistTasks() { write('mathmateDarsyarTasks', JSON.stringify(state.tasks)); }
    function applyLocale() {
      if (typeof window.__dsSyncPriorityLabels === "function") window.__dsSyncPriorityLabels();
      try { if (typeof renderLiveClock === "function") renderLiveClock(); } catch (_) {}

      app.lang = state.lang; app.dir = state.lang === 'fa' ? 'rtl' : 'ltr';
      $$('.ds-tabs [data-view]').forEach(button => button.setAttribute('aria-current', button.dataset.view === state.view ? 'page' : 'false'));
      $$('[data-fa][data-en]').forEach(el => {
        const value = state.lang === 'fa' ? el.dataset.fa : el.dataset.en;
        if (value != null) el.textContent = value;
      });
      $$('[data-placeholder-fa][data-placeholder-en]').forEach(el => { el.placeholder = state.lang === 'fa' ? el.dataset.placeholderFa : el.dataset.placeholderEn; });
      $$('[data-setting-key="language"]').forEach(button=>button.classList.toggle('is-active',button.dataset.settingValue===state.lang));
      renderGreeting(); renderSummaries(); renderCalendars(); renderTaskLists(); renderNotesPreview(); renderProfile(); syncSettingsUI();
    }
    function renderGreeting() {
      // Keep the greeting requested for this screen; personalize only the name.
      const name = state.profileName.trim() || (state.lang === 'fa' ? 'دوست من' : 'friend');
      $('#dsGreetingTitle').textContent = state.lang === 'fa' ? `عصر بخیر، ${name}!` : `Good evening, ${name}!`;
      $('#dsGreetingText').textContent = state.lang === 'fa'
        ? 'امروز فرصت تازه‌ای برای یادگیریه. با یک کار کوچک شروع کن و قدم‌به‌قدم جلو برو.'
        : 'Today is a fresh chance to learn. Start with one small task and move forward step by step.';
      $('#dsTodayCaption').textContent = state.lang === 'fa' ? `کارهای ${formatDate(today,{weekday:'long',month:'long',day:'numeric'})} را از همین‌جا مدیریت کن.` : `Manage your tasks for ${formatDate(today,{weekday:'long',month:'long',day:'numeric'})} here.`;
      $('#dsCalendarSubtitle').textContent = state.lang === 'fa' ? `امروز: ${formatDate(today,{weekday:'long',month:'short',day:'numeric'})}` : `Today: ${formatDate(today,{weekday:'long',month:'short',day:'numeric'})}`;
    }
    function renderSummaries() {
      const c = taskCounts();
      $('#dsTotalTasks').textContent = new Intl.NumberFormat(locale()).format(c.total);
      $('#dsDoneTasks').textContent = new Intl.NumberFormat(locale()).format(c.done);
      $('#dsRemainingTasks').textContent = new Intl.NumberFormat(locale()).format(c.remaining);
      $('#dsTaskCountCaption').textContent = state.lang === 'fa' ? `${c.total} تکلیف` : `${c.total} task${c.total===1?'':'s'}`;
    }
    function emptyState(title, description) {
      return `<div class="ds-empty"><span class="ds-empty-symbol" aria-hidden="true">📘</span><strong>${escapeHTML(title)}</strong><span>${escapeHTML(description)}</span></div>`;
    }
    function taskRow(task) {
      const priorityLabel = state.lang === 'fa' ? ({low:'کم',medium:'معمولی',high:'زیاد'}[task.priority]) : ({low:'Low',medium:'Medium',high:'High'}[task.priority]);
      const dueKey = task.dueDate && validDateKey(task.dueDate) ? task.dueDate : '';
      const todayKey = dateKey(new Date());
      const isOverdue = !task.done && dueKey && dueKey < todayKey;
      const dueLabel = isOverdue
        ? (state.lang==='fa' ? 'تاریخ گذشته' : 'Overdue')
        : ((state.lang==='fa'?'موعد':'Due') + ': ' + formatDate(parseDate(task.dueDate), {month:'short',day:'numeric'}));
      return `<article class="ds-task-item ${task.done?'is-done':''}${isOverdue?' is-overdue':''}" data-task-id="${escapeHTML(task.id)}">
        <button type="button" class="ds-task-check" data-action="toggle-task" data-task-id="${escapeHTML(task.id)}" aria-label="${task.done?(state.lang==='fa'?'علامت‌گذاری به‌عنوان انجام‌نشده':'Mark as not done'):(state.lang==='fa'?'علامت‌گذاری به‌عنوان انجام‌شده':'Mark as complete')}" aria-pressed="${task.done}">${task.done?icon('check'):''}</button>
        <div class="ds-task-copy"><div class="ds-task-title">${escapeHTML(task.title)}</div><div class="ds-task-meta">${task.subject?`<span class="ds-task-subject">${escapeHTML(task.subject)}</span>`:''}<span class="${isOverdue?'ds-task-overdue':''}">${escapeHTML(dueLabel)}</span><span class="ds-task-priority" data-priority="${task.priority}">${escapeHTML(priorityLabel)}</span></div></div>
        <button type="button" class="ds-task-delete" data-action="delete-task" data-task-id="${escapeHTML(task.id)}" aria-label="${state.lang==='fa'?'حذف تکلیف':'Delete task'}">${icon('trash')}</button>
      </article>`;
    }
    function renderTaskLists() {
      const sorted = [...state.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||a.dueDate.localeCompare(b.dueDate)||b.createdAt-a.createdAt);
      let todayTasks = sorted.filter(t=>t.dueDate===dateKey(today));
      if (!todayTasks.length) todayTasks = sorted.filter(t=>!t.done).slice(0,4);
      $('#dsTodayTaskList').innerHTML = todayTasks.length ? todayTasks.slice(0,5).map(taskRow).join('') : emptyState(state.lang==='fa'?'فعلاً کاری برای امروز ثبت نشده':'No tasks for today yet',state.lang==='fa'?'می‌توانی اولین تکلیفت را همین حالا اضافه کنی.':'Add your first task whenever you are ready.');
      let visible = sorted;
      if (state.taskFilter==='pending') visible=visible.filter(t=>!t.done);
      if (state.taskFilter==='done') visible=visible.filter(t=>t.done);
      if (state.searchText.trim()) {
        const q=state.searchText.trim().toLocaleLowerCase();
        visible=visible.filter(t=>`${t.title} ${t.subject}`.toLocaleLowerCase().includes(q));
      }
      $('#dsAllTaskList').innerHTML = visible.length ? visible.map(taskRow).join('') : emptyState(state.lang==='fa'?'تکلیفی پیدا نشد':'No tasks found',state.lang==='fa'?'عنوان دیگری جست‌وجو کن یا یک تکلیف تازه ثبت کن.':'Try another search, or add a new task.');
      $$('.ds-filter-button').forEach(b=>b.classList.toggle('is-active',b.dataset.taskFilter===state.taskFilter));
      renderSummaries(); renderSelectedDayTasks();
    }
    function renderCalendarInto(gridId, monthId, selectedId, countId) {
      const grid = $('#'+gridId); if (!grid) return;
      const first = calendarFirstDay(state.calendarCursor);
      const p = calendarParts(first);
      const monthLabel = state.lang==='fa'
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'long',year:'numeric'}).format(first)
        : new Intl.DateTimeFormat('en-US-u-ca-gregory',{month:'long',year:'numeric'}).format(first);
      $('#'+monthId).textContent = monthLabel;
      const isPersian = state.lang==='fa';
      const offset = isPersian ? (first.getDay()+1)%7 : (first.getDay()+6)%7;
      const weekdays = isPersian ? ['ش','ی','د','س','چ','پ','ج'] : ['M','T','W','T','F','S','S'];
      const cells=[];
      weekdays.forEach((day,i)=>cells.push(`<div class="ds-weekday" role="columnheader" aria-label="${isPersian?(['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'][i]):(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i])}">${day}</div>`));
      let startDate = addDays(first,-offset);
      let totalDays = 1; while(totalDays<35 && sameCalendarMonth(addDays(first,totalDays-1),first)) totalDays++;
      const cellCount = Math.ceil((offset+totalDays)/7)*7;
      const taskDates = new Set(state.tasks.filter(t=>!t.done).map(t=>t.dueDate));
      for(let i=0;i<cellCount;i++) {
        const d=addDays(startDate,i), key=dateKey(d), inside=sameCalendarMonth(d,first), selected=key===dateKey(state.selectedDate), isToday=key===dateKey(today), hasTask=taskDates.has(key);
        const label=dateFormatter({day:'numeric'}).format(d);
        const a11y=formatDate(d,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
        cells.push(`<button type="button" role="gridcell" class="ds-calendar-day ${inside?'':'is-outside'} ${selected?'is-selected':''} ${isToday?'is-today':''} ${hasTask?'has-task':''}" data-action="select-date" data-date="${key}" aria-label="${escapeHTML(a11y)}" aria-pressed="${selected}">${escapeHTML(label)}</button>`);
      }
      grid.innerHTML=cells.join('');
      const selectedTasks=state.tasks.filter(t=>t.dueDate===dateKey(state.selectedDate));
      const label=formatDate(state.selectedDate,{weekday:'long',month:'long',day:'numeric'});
      const count=state.lang==='fa'?`${selectedTasks.length} تکلیف`:`${selectedTasks.length} task${selectedTasks.length===1?'':'s'}`;
      const out1=$('#'+selectedId); if(out1) out1.textContent=`${state.lang==='fa'?'انتخاب‌شده':'Selected'}: ${label}`;
      const out2=$('#'+countId); if(out2) out2.textContent=count;
    }
    function renderCalendars() {
      if(!$('#dsCalendarGrid')) return;
      renderCalendarInto('dsCalendarGrid','dsCalendarMonth','dsSelectedDateLabel','dsSelectedDateTasks');
      renderCalendarInto('dsFullCalendarGrid','dsFullCalendarMonth','dsFullSelectedDateLabel','dsFullSelectedDateTasks');
      $('#dsDayTasksCaption').textContent=formatDate(state.selectedDate,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
      renderSelectedDayTasks();
    }
    function renderSelectedDayTasks() {
      const target=$('#dsSelectedDayTasks'); if(!target) return;
      const items=state.tasks.filter(t=>t.dueDate===dateKey(state.selectedDate)).sort((a,b)=>Number(a.done)-Number(b.done));
      target.innerHTML=items.length?items.map(taskRow).join(''):emptyState(state.lang==='fa'?'برای این روز تکلیفی نیست':'No tasks on this day',state.lang==='fa'?'از بخش تکلیف‌ها مورد تازه‌ای اضافه کن.':'Add one from the Tasks section.');
    }
    function persistNotesList(){
      write('mathmateDarsyarNotesList', JSON.stringify(state.notesList));
      // keep legacy single-string key as a summary for older code paths
      const summary = state.notesList.map(n => `${n.title}: ${n.body}`).join('\n\n').slice(0, 8000);
      write('mathmateDarsyarNotes', summary);
    }
    function stripHtml(html){
      try {
        const d=document.createElement('div');
        d.innerHTML=String(html||'');
        return (d.textContent||d.innerText||'').replace(/\s+/g,' ').trim();
      } catch(_) { return String(html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
    }
    function renderNotesList(){
      const list=$('#dsNotesList'); if(!list) return;
      const items=[...state.notesList].sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));
      const caption=$('#dsNotesCountCaption');
      if(caption) caption.textContent=state.lang==='fa'?`${items.length} یادداشت`:`${items.length} note${items.length===1?'':'s'}`;
      if(!items.length){
        list.innerHTML=emptyState(state.lang==='fa'?'هنوز یادداشتی نداری':'No notes yet', state.lang==='fa'?'اولین یادداشتت را با موضوع اضافه کن.':'Add your first titled note.');
        return;
      }
      list.innerHTML=items.map(note=>{
        const plain=stripHtml(note.body||'');
        const snippet=escapeHTML(plain.slice(0,160))+(plain.length>160?'…':'');
        return `<article class="ds-task-item" data-note-id="${escapeHTML(note.id)}"><div class="ds-task-check" aria-hidden="true" style="visibility:hidden"></div><div><div class="ds-task-title">${escapeHTML(note.title||'')}</div><div class="ds-task-meta"><span>${snippet}</span></div></div><div style="display:flex;gap:4px"><button type="button" class="ds-task-delete" data-action="edit-note" data-note-id="${escapeHTML(note.id)}" title="${state.lang==='fa'?'ویرایش':'Edit'}" aria-label="${state.lang==='fa'?'ویرایش':'Edit'}">${icon('edit')}</button><button type="button" class="ds-task-delete" data-action="delete-note" data-note-id="${escapeHTML(note.id)}" title="${state.lang==='fa'?'حذف':'Delete'}" aria-label="${state.lang==='fa'?'حذف':'Delete'}">${icon('trash')}</button></div></article>`;
      }).join('');
    }
    function renderNotesPreview(){
      const preview=$('#dsQuickNotePreview');
      const items=[...state.notesList].sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));
      if(preview){
        if(!items.length) preview.textContent=state.lang==='fa'?'هنوز یادداشتی ننوشته‌ای. با یک نکتهٔ کوتاه شروع کن.':'No notes yet. Start with a quick reminder.';
        else {
          const n=items[0];
          const plain=stripHtml(n.body||'');
          preview.textContent=`${n.title}: ${plain.slice(0,180)}${plain.length>180?'…':''}`;
        }
      }
      renderNotesList();
    }
    function resetNoteForm(){
      state.editingNoteId=null;
      const form=$('#dsNoteForm'); if(form) form.reset();
      const body=$('#dsNoteBody'); if(body){ if(body.isContentEditable) body.innerHTML=''; else body.value=''; }
      if (typeof window.__dsNoteSetImages === 'function') window.__dsNoteSetImages([]);
      else { const box=$('#dsNoteImages'); if(box) box.innerHTML=''; }
      const titleEl=$('#dsNoteFormTitle'); if(titleEl) titleEl.textContent=state.lang==='fa'?'یادداشت جدید':'New note';
      const submit=$('#dsNoteSubmit'); if(submit) submit.innerHTML=`${icon('plus')}<span data-fa="افزودن یادداشت" data-en="Add note">${state.lang==='fa'?'افزودن یادداشت':'Add note'}</span>`;
      const cancel=$('#dsNoteCancel'); if(cancel) cancel.hidden=true;
    }
    function renderProfile() {
      const name=state.profileName.trim() || (state.lang==='fa'?'دوست من':'Friend');
      $('#dsProfileName').value=state.profileName;
      $('#dsProfilePreviewName').textContent=name;
      const saved=read('mathmateAvatar','') || makeAvatar('🎓','#6c63ff');
      const preview=state.customAvatar || state.draftAvatar || saved;
      $('#dsAvatarPreview').src=preview;
      $('#dsTopAvatar').src=saved;
      $('#dsTopAvatar').onerror=()=>{ $('#dsTopAvatar').src=makeAvatar('🎓','#6c63ff'); };
      $('#dsAvatarPreview').onerror=()=>{ $('#dsAvatarPreview').src=makeAvatar('🎓','#6c63ff'); };
      const grid=$('#dsAvatarGrid');
      grid.innerHTML=avatarChoices.map(([emoji,color],i)=>{
        const src=makeAvatar(emoji,color); const selected=state.draftAvatar===src || (!state.customAvatar && state.draftAvatar===emoji);
        return `<button type="button" class="ds-avatar-choice ${selected?'is-selected':''}" data-avatar-index="${i}" aria-label="${state.lang==='fa'?'آواتار':'Avatar'} ${i+1}" aria-pressed="${selected}" title="${emoji}">${emoji}</button>`;
      }).join('');
      if($('#dsProfileStatus') && !$('#dsProfileStatus').dataset.persistStatus) $('#dsProfileStatus').textContent='';
    }
    function syncSettingsUI() {
      $$('[data-setting-key]').forEach(button=>{
        const key=button.dataset.settingKey; const value=button.dataset.settingValue;
        const active = key==='theme'?value===state.theme:key==='colorTheme'?value===state.colorTheme:key==='fontSize'?value===state.fontSize:key==='language'?value===state.lang:key==='animations'?String(state.animations)===value:false;
        button.classList.toggle('is-active',active); button.setAttribute('aria-pressed',String(active));
      });
    }
    function switchView(view) {
      if (!['dashboard','tasks','calendar','notes','account','settings'].includes(view)) return;
      state.view=view;
      $$('[data-panel]').forEach(panel=>panel.classList.toggle('is-active',panel.dataset.panel===view));
      $$('.ds-tab[data-view]').forEach(tab=>tab.classList.toggle('is-active',tab.dataset.view===view));
      if(view==='calendar') renderCalendars();
      if(view==='account') renderProfile();
      if(view==='settings') syncSettingsUI();
      if(view==='tasks' && shadow.activeElement !== $('#dsSearchInput')) $('#dsTaskTitle')?.focus({preventScroll:true});
      window.dispatchEvent(new CustomEvent('mathmate:darsyar-view-changed',{detail:{view}}));
    }
    function saveProfile() {
      const name=$('#dsProfileName').value.trim().slice(0,50);
      const avatar=state.customAvatar || state.draftAvatar || makeAvatar('🎓','#6c63ff');
      try { localStorage.setItem('mathmateName',name); localStorage.setItem('mathmateAvatar',avatar); }
      catch { $('#dsProfileStatus').textContent=state.lang==='fa'?'ذخیره‌سازی اطلاعات ممکن نشد؛ احتمالاً فضای مرورگر پر است.':'Could not save the profile; browser storage may be full.'; return; }
      state.profileName=name; state.draftAvatar=avatar; state.customAvatar='';
      const welcomeName=document.getElementById('welcomeUserName');
      if(welcomeName) welcomeName.textContent=name ? (state.lang==='en'?`, ${name}!`:`، ${name}!`) : '';
      const sidebarAvatar=document.getElementById('sidebarAvatarImg'); if(sidebarAvatar) sidebarAvatar.src=avatar;
      $('#dsProfileStatus').dataset.persistStatus='true';
      $('#dsProfileStatus').textContent=state.lang==='fa'?'نام و آواتار با موفقیت ذخیره شدند.':'Name and avatar saved successfully.';
      renderGreeting(); renderProfile();
      window.dispatchEvent(new CustomEvent('mathmate:profile-changed',{detail:{name,avatar}}));
      toast(state.lang==='fa'?'اطلاعات حساب ذخیره شد.':'Profile saved.');
    }
    function handleTaskSubmit(event) {
      event.preventDefault();
      const form=event.currentTarget; const data=new FormData(form);
      const title=String(data.get('title')||'').trim().slice(0,180);
      if(!title){$('#dsTaskTitle').focus();return;}
      const dupTask=state.tasks.find(t=>String(t.title||'').trim()===title);
      if(dupTask){toast(state.lang==='fa'?'تکلیفی با این عنوان از قبل هست؛ عنوان را عوض کن.':'A task with this title already exists. Please choose a different title.');return;}
      const dueInput=$('#dsTaskDueDate');
      const dueDate=(dueInput && dueInput.dataset.mmIsoDate && /^\d{4}-\d{2}-\d{2}$/.test(dueInput.dataset.mmIsoDate))
        ? dueInput.dataset.mmIsoDate
        : String(data.get('dueDate')||dateKey(today));
      if(!isValidDateKey(dueDate)){toast(state.lang==='fa'?'تاریخ تکلیف معتبر نیست.':'Please enter a valid due date.');return;}
      const task={id:`t-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title,subject:String(data.get('subject')||'').trim().slice(0,80),dueDate,priority:['low','medium','high'].includes(data.get('priority'))?data.get('priority'):'medium',done:false,createdAt:Date.now()};
      state.tasks.push(task); persistTasks();
      form.reset(); const dueEl=$('#dsTaskDueDate'); if(dueEl){ dueEl.value=dateKey(today); dueEl.dataset.mmIsoDate=dateKey(today); } $('#dsTaskPriority').value='medium'; if (typeof window.__dsSyncPriorityLabels === 'function') window.__dsSyncPriorityLabels();
      state.selectedDate=parseDate(dueDate); state.calendarCursor=parseDate(dueDate);
      renderTaskLists();renderCalendars();renderSummaries();
      toast(state.lang==='fa'?'تکلیف جدید ثبت شد.':'Task added.');
    }
    
    function dsConfirm(message) {
      return new Promise((resolve) => {
        try {
          const host = document.body;
          const overlay = document.createElement('div');
          overlay.className = 'mm-confirm-overlay';
          overlay.setAttribute('role', 'dialog');
          overlay.setAttribute('aria-modal', 'true');
          const isEn = state.lang === 'en';
          overlay.innerHTML = '<div class="mm-confirm-dialog"><p></p><div class="mm-confirm-actions"><button type="button" class="mm-confirm-cancel"></button><button type="button" class="mm-confirm-ok"></button></div></div>';
          overlay.querySelector('p').textContent = message;
          overlay.querySelector('.mm-confirm-ok').textContent = isEn ? 'OK' : 'تأیید';
          overlay.querySelector('.mm-confirm-cancel').textContent = isEn ? 'Cancel' : 'لغو';
          const finish = (v) => { try { overlay.remove(); } catch(_){} resolve(v); };
          overlay.querySelector('.mm-confirm-ok').addEventListener('click', () => finish(true));
          overlay.querySelector('.mm-confirm-cancel').addEventListener('click', () => finish(false));
          overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(false); });
          host.appendChild(overlay);
        } catch (_) {
          resolve(window.confirm(message));
        }
      });
    }

    function updateTask(id, action) {
      const index=state.tasks.findIndex(t=>t.id===id); if(index<0)return;
      if(action==='toggle') {
        state.tasks[index].done=!state.tasks[index].done;
        persistTasks();renderTaskLists();renderCalendars();
        return;
      }
      if(action==='delete') {
        const confirmMessage=state.lang==='fa'?'این تکلیف حذف شود؟':'Delete this task?';
        dsConfirm(confirmMessage).then(ok=>{
          if(!ok)return;
          const i=state.tasks.findIndex(t=>t.id===id);
          if(i<0)return;
          state.tasks.splice(i,1);
          persistTasks();renderTaskLists();renderCalendars();
        });
        return;
      }
      persistTasks();renderTaskLists();renderCalendars();
    }
    function requestSetting(key,value) {
      let normalized=value;
      if(key==='animations') normalized=value==='true'||value===true;
      if(key==='theme'&&!['light','dark'].includes(normalized))return;
      if(key==='colorTheme'&&!['instagram','pink-purple','blue-purple','gold-black'].includes(normalized))return;
      if(key==='fontSize'&&!['small','normal','large'].includes(normalized))return;
      if(key==='language'&&!['fa','en'].includes(normalized))return;
      if(key==='animations'&&typeof normalized!=='boolean')return;
      window.dispatchEvent(new CustomEvent('mathmate:darsyar-setting-request',{detail:{key,value:normalized}}));
      // The host remains the source of truth; apply optimistically for instant feedback.
      const detail={theme:state.theme,colorTheme:state.colorTheme,fontSize:state.fontSize,language:state.lang,animations:state.animations};
      if(key==='theme')detail.theme=normalized;
      if(key==='colorTheme')detail.colorTheme=normalized;
      if(key==='fontSize')detail.fontSize=normalized;
      if(key==='language')detail.language=normalized;
      if(key==='animations')detail.animations=normalized;
      applyHostSettings(detail);
    }
    function applyHostSettings(settings) {
      if(!settings || typeof settings!=='object')return;
      if(['light','dark'].includes(settings.theme))state.theme=settings.theme;
      if(['instagram','pink-purple','blue-purple','gold-black'].includes(settings.colorTheme))state.colorTheme=settings.colorTheme;
      if(['small','normal','large'].includes(settings.fontSize))state.fontSize=settings.fontSize;
      if(['fa','en'].includes(settings.language))state.lang=settings.language;
      if(typeof settings.animations==='boolean')state.animations=settings.animations;
      app.dataset.theme=state.colorTheme;app.dataset.mode=state.theme;app.dataset.fontSize=state.fontSize;app.dataset.animations=state.animations?'on':'off';
      app.dir=state.lang==='fa'?'rtl':'ltr';app.lang=state.lang;
      applyLocale();
    }

    // Event delegation keeps controls working when lists and calendars rerender.
    app.addEventListener('click', event => {
      const target=event.target.closest('button,[data-action]'); if(!target || !app.contains(target))return;
      if(target.matches('[data-view]')) { switchView(target.dataset.view); return; }
      if(target.id==='dsProfileShortcut') { switchView('account'); return; }
      if(target.id==='dsSearchToggle') { const input=$('#dsSearchInput'); window.requestAnimationFrame(()=>input?.focus({preventScroll:true})); return; }
      if(target.dataset.action==='switch-view') { switchView(target.dataset.targetView); return; }
      if(target.dataset.action==='calendar-prev') { nextCalendarMonth(-1);return; }
      if(target.dataset.action==='calendar-next') { nextCalendarMonth(1);return; }
      if(target.dataset.action==='select-date') { state.selectedDate=parseDate(target.dataset.date);if(!sameCalendarMonth(state.selectedDate,state.calendarCursor))state.calendarCursor=new Date(state.selectedDate);renderCalendars();if(state.view==='calendar')renderSelectedDayTasks();return; }
      if(target.dataset.action==='toggle-task') { updateTask(target.dataset.taskId,'toggle');return; }
      if(target.dataset.action==='delete-task') { updateTask(target.dataset.taskId,'delete');return; }
      if(target.dataset.action==='delete-note') {
        const id=target.dataset.noteId;
        const msg=state.lang==='fa'?'این یادداشت حذف شود؟':'Delete this note?';
        dsConfirm(msg).then(ok=>{
          if(!ok) return;
          state.notesList=state.notesList.filter(n=>n.id!==id);
          if(state.editingNoteId===id) resetNoteForm();
          persistNotesList(); renderNotesPreview();
        });
        return;
      }
      if(target.dataset.action==='edit-note') {
        const id=target.dataset.noteId;
        const note=state.notesList.find(n=>n.id===id);
        if(!note) return;
        state.editingNoteId=id;
        const t=$('#dsNoteTitle'); if(t) t.value=note.title||'';
        const b=$('#dsNoteBody');
        let bodyHtml = note.body || '';
        let imgs = Array.isArray(note.images) ? note.images.slice() : [];
        if (typeof window.__dsNoteExtractEmbeddedImages === 'function') {
          const extracted = window.__dsNoteExtractEmbeddedImages(bodyHtml);
          bodyHtml = extracted.bodyHtml;
          if (extracted.images.length) imgs = imgs.concat(extracted.images);
        }
        if (b) {
          if (b.isContentEditable) b.innerHTML = bodyHtml;
          else b.value = bodyHtml;
        }
        if (typeof window.__dsNoteSetImages === 'function') window.__dsNoteSetImages(imgs);
        else {
          const box = $('#dsNoteImages');
          if (box) box.innerHTML = imgs.map((src,i)=>`<div class="ds-note-image-card"><img src="${src}" alt=""></div>`).join('');
        }
        const titleEl=$('#dsNoteFormTitle'); if(titleEl) titleEl.textContent=state.lang==='fa'?'ویرایش یادداشت':'Edit note';
        const submit=$('#dsNoteSubmit'); if(submit) submit.innerHTML=`${icon('check')}<span>${state.lang==='fa'?'ذخیره تغییرات':'Save changes'}</span>`;
        const cancel=$('#dsNoteCancel'); if(cancel) cancel.hidden=false;
        switchView('notes');
        t?.focus({preventScroll:true});
        return;
      }
      if(target.dataset.taskFilter) { state.taskFilter=target.dataset.taskFilter;renderTaskLists();return; }
      if(target.dataset.settingKey) { requestSetting(target.dataset.settingKey,target.dataset.settingValue);return; }
      if(target.dataset.avatarIndex != null) { const choice=avatarChoices[Number(target.dataset.avatarIndex)];if(choice){state.draftAvatar=makeAvatar(choice[0],choice[1]);state.customAvatar='';$('#dsProfileStatus').dataset.persistStatus='';renderProfile();}return; }
    });

    $('#dsTaskForm').addEventListener('submit',handleTaskSubmit);
    $('#dsSaveProfile').addEventListener('click',saveProfile);
    $('#dsProfileName').addEventListener('input',()=>{state.profileName=$('#dsProfileName').value.slice(0,50);$('#dsProfilePreviewName').textContent=state.profileName.trim()||(state.lang==='fa'?'دوست من':'Friend');});
    $('#dsPhotoInput').addEventListener('change',event=>{
      const file=event.target.files?.[0]; if(!file)return;
      if(!file.type.startsWith('image/')){toast(state.lang==='fa'?'لطفاً یک فایل تصویری انتخاب کن.':'Please choose an image file.');event.target.value='';return;}
      if(file.size>3*1024*1024){toast(state.lang==='fa'?'حجم تصویر باید کمتر از ۳ مگابایت باشد.':'The image must be smaller than 3 MB.');event.target.value='';return;}
      const reader=new FileReader();reader.onload=()=>{
        if(typeof reader.result!=='string')return;
        const image=new Image();
        image.onload=()=>{
          // Resize/crop is deliberately avoided; fit the full photo into a modest JPEG
          // so LocalStorage limits are much less likely to prevent profile saving.
          const scale=Math.min(1,640/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
          const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round((image.naturalWidth||image.width)*scale));canvas.height=Math.max(1,Math.round((image.naturalHeight||image.height)*scale));
          const context=canvas.getContext('2d');if(!context){toast(state.lang==='fa'?'پردازش تصویر در این مرورگر ممکن نیست.':'Image processing is not supported in this browser.');return;}
          context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
          try{state.customAvatar=canvas.toDataURL('image/jpeg',.82);state.draftAvatar=state.customAvatar;$('#dsProfileStatus').dataset.persistStatus='';renderProfile();}
          catch{toast(state.lang==='fa'?'پردازش تصویر ممکن نشد.':'Could not process the image.');}
        };
        image.onerror=()=>toast(state.lang==='fa'?'خواندن تصویر ممکن نشد.':'Could not read the image.');image.src=reader.result;
      };reader.onerror=()=>toast(state.lang==='fa'?'خواندن تصویر ممکن نشد.':'Could not read the image.');reader.readAsDataURL(file);
    });
    const noteForm=$('#dsNoteForm');
    if(noteForm) noteForm.addEventListener('submit', event=>{
      event.preventDefault();
      const title=String($('#dsNoteTitle')?.value||'').trim().slice(0,120);
      const bodyEl=$('#dsNoteBody');
      let bodyRaw=bodyEl ? (bodyEl.innerHTML || '') : '';
      // strip any accidental imgs from editor body
      if (typeof window.__dsNoteExtractEmbeddedImages === 'function') {
        const extracted = window.__dsNoteExtractEmbeddedImages(bodyRaw);
        bodyRaw = extracted.bodyHtml;
        if (extracted.images.length && typeof window.__dsNoteSetImages === 'function') {
          const current = (typeof window.__dsNoteGetImages === 'function' ? window.__dsNoteGetImages() : []) || [];
          window.__dsNoteSetImages([...current, ...extracted.images]);
        }
      }
      const bodyText=(bodyEl?.innerText || '').replace(/\u00a0/g,' ').trim();
      const images = (typeof window.__dsNoteGetImages === 'function' ? window.__dsNoteGetImages() : []) || [];
      const body=String(bodyRaw).slice(0,80000);
      if(!title||(!bodyText && !images.length)){toast(state.lang==='fa'?'عنوان و متن یا تصویر یادداشت لازم است.':'Title and note text or image are required.');return;}
      const dupNote=state.notesList.find(n=>n.title===title && n.id!==state.editingNoteId);
      if(dupNote){toast(state.lang==='fa'?'یادداشتی با این عنوان از قبل هست؛ عنوان را عوض کن.':'A note with this title already exists. Please choose a different title.');return;}
      const now=Date.now();
      if(state.editingNoteId){
        const note=state.notesList.find(n=>n.id===state.editingNoteId);
        if(note){note.title=title;note.body=body;note.images=images;note.updatedAt=now;}
      } else {
        state.notesList.push({id:`n-${now}-${Math.random().toString(36).slice(2,7)}`,title,body,images,createdAt:now,updatedAt:now});
      }
      persistNotesList();
      resetNoteForm();
      renderNotesPreview();
      const status=$('#dsNotesStatus'); if(status){ status.textContent=state.lang==='fa'?'ذخیره شد.':'Saved.'; clearTimeout(status._hideTimer); status._hideTimer=setTimeout(()=>{status.textContent='';},3000); }
      toast(state.lang==='fa'?'یادداشت ذخیره شد.':'Note saved.');
    });
    
    // Rich note toolbar: bold / italic / underline / highlight menu / images zone
    (function wireNoteRichEditor(){
      const editor = $('#dsNoteBody');
      const toolbar = $('#dsNoteToolbar');
      const imagesBox = $('#dsNoteImages');
      if (!editor || !toolbar || toolbar.dataset.ready === '1') return;
      toolbar.dataset.ready = '1';
      let highlightColor = '#ef4444';
      let savedRange = null;
      const group = $('#dsHighlightGroup');
      const caret = $('#dsHighlightCaret');
      const menu = $('#dsHighlightMenu');
      function getEditorSelection(){
        try {
          const root = editor.getRootNode && editor.getRootNode();
          if (root && root.getSelection) return root.getSelection();
        } catch (_) {}
        return window.getSelection();
      }
      function saveSelection(){
        const sel = getEditorSelection();
        if (!sel || !sel.rangeCount) { savedRange = null; return; }
        const range = sel.getRangeAt(0);
        // only keep selections that live inside the note editor
        if (!editor.contains(range.commonAncestorContainer)) { savedRange = null; return; }
        if (range.collapsed) { savedRange = null; return; }
        try { savedRange = range.cloneRange(); } catch (_) { savedRange = range; }
      }
      function restoreSelection(){
        if (!savedRange) return false;
        try {
          const sel = getEditorSelection();
          if (!sel) return false;
          sel.removeAllRanges();
          sel.addRange(savedRange);
          return true;
        } catch (_) { return false; }
      }
      // Preserve selection when interacting with toolbar (mousedown would otherwise clear it).
      // Do NOT preventDefault on the caret itself — that blocks the second click from closing the menu.
      toolbar.addEventListener('pointerdown', (e) => {
        const isCaret = !!e.target.closest('#dsHighlightCaret');
        if (e.target.closest('.ds-note-tool, .ds-hl-group, .ds-hl-option, .ds-hl-menu')) {
          saveSelection();
          if (!isCaret) e.preventDefault();
        }
      });
      editor.addEventListener('mouseup', saveSelection);
      editor.addEventListener('keyup', saveSelection);
      editor.addEventListener('touchend', () => setTimeout(saveSelection, 0));

      function closeHlMenu(){
        if (!menu || !caret || !group) return;
        menu.hidden = true;
        group.classList.remove('is-open');
        caret.setAttribute('aria-expanded', 'false');
      }
      function openHlMenu(){
        if (!menu || !caret || !group) return;
        // Rebuild options so each label always has a round color preview beside it
        const colors = [
          { color: '#ef4444', fa: 'قرمز', en: 'Red' },
          { color: '#3b82f6', fa: 'آبی', en: 'Blue' },
          { color: '#22c55e', fa: 'سبز', en: 'Green' },
          { color: '#fde047', fa: 'زرد', en: 'Yellow' },
          { color: '#ec4899', fa: 'صورتی', en: 'Pink' },
          { color: '#f97316', fa: 'نارنجی', en: 'Orange' }
        ];
        menu.innerHTML = colors.map((c) => {
          const selected = c.color.toLowerCase() === String(highlightColor).toLowerCase();
          const label = state.lang === 'en' ? c.en : c.fa;
          return `<button type="button" class="ds-hl-option${selected ? ' is-selected' : ''}" role="option" data-color="${c.color}" aria-selected="${selected ? 'true' : 'false'}">`+
            `<span class="ds-hl-dot" style="background:${c.color}"></span>`+
            `<span class="ds-hl-label">${label}</span>`+
            `</button>`;
        }).join('');
        menu.hidden = false;
        group.classList.add('is-open');
        caret.setAttribute('aria-expanded', 'true');
      }
      caret?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveSelection();
        const isOpen = group.classList.contains('is-open') && menu && !menu.hidden;
        if (isOpen) closeHlMenu();
        else openHlMenu();
      });
      menu?.addEventListener('click', (e) => {
        const opt = e.target.closest('.ds-hl-option');
        if (!opt) return;
        e.preventDefault();
        e.stopPropagation();
        highlightColor = opt.dataset.color || '#ef4444';
        menu.querySelectorAll('.ds-hl-option').forEach(o => o.classList.toggle('is-selected', o === opt));
        closeHlMenu();
        applyHighlight();
      });
      // Close when clicking outside (bubble phase so caret click runs first)
      document.addEventListener('click', (e) => {
        if (!group) return;
        const path = e.composedPath ? e.composedPath() : [];
        if (path.includes(group) || group.contains(e.target)) return;
        closeHlMenu();
      });

      function applyHighlight(){
        editor.focus({ preventScroll: true });
        restoreSelection();
        const sel = getEditorSelection();
        let range = null;
        if (savedRange) {
          try { range = savedRange.cloneRange(); } catch (_) { range = savedRange; }
        } else if (sel && sel.rangeCount && !sel.isCollapsed) {
          range = sel.getRangeAt(0);
        }
        if (!range || range.collapsed) {
          toast(state.lang === 'fa' ? 'ابتدا متن را انتخاب کن.' : 'Select some text first.');
          return;
        }
        if (!editor.contains(range.commonAncestorContainer)) {
          toast(state.lang === 'fa' ? 'ابتدا متن داخل یادداشت را انتخاب کن.' : 'Select text inside the note first.');
          return;
        }
        try {
          const span = document.createElement('span');
          span.className = 'ds-hl';
          span.style.backgroundColor = highlightColor;
          span.style.color = '#000';
          span.appendChild(range.extractContents());
          range.insertNode(span);
          // move caret after the highlighted span
          const after = document.createRange();
          after.setStartAfter(span);
          after.collapse(true);
          const s2 = getEditorSelection();
          if (s2) { s2.removeAllRanges(); s2.addRange(after); }
          savedRange = null;
        } catch (err) {
          try {
            restoreSelection();
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('hiliteColor', false, highlightColor);
            document.execCommand('foreColor', false, '#000000');
          } catch (_) {
            toast(state.lang === 'fa' ? 'هایلایت اعمال نشد. دوباره امتحان کن.' : 'Could not apply highlight. Try again.');
          }
        }
      }

      function renderImageCards(srcs){
        if (!imagesBox) return;
        const list = Array.isArray(srcs) ? srcs.filter(Boolean) : [];
        imagesBox.innerHTML = list.map((src, i) => (
          `<div class="ds-note-image-card" data-img-index="${i}">`+
          `<img src="${src}" alt="">`+
          `<button type="button" class="ds-note-image-remove" data-remove-img="${i}" aria-label="${state.lang==='fa'?'حذف تصویر':'Remove image'}">×</button>`+
          `</div>`
        )).join('');
      }
      function getImageSrcs(){
        if (!imagesBox) return [];
        return [...imagesBox.querySelectorAll('img')].map(img => img.getAttribute('src')).filter(Boolean);
      }
      window.__dsNoteGetImages = getImageSrcs;
      window.__dsNoteSetImages = renderImageCards;
      window.__dsNoteExtractEmbeddedImages = function(html){
        const wrap = document.createElement('div');
        wrap.innerHTML = String(html || '');
        const srcs = [...wrap.querySelectorAll('img')].map(img => img.getAttribute('src')).filter(Boolean);
        wrap.querySelectorAll('img').forEach(img => img.remove());
        // clean empty leftover
        return { bodyHtml: wrap.innerHTML, images: srcs };
      };

      imagesBox?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-remove-img]');
        if (!btn) return;
        e.preventDefault();
        const idx = Number(btn.getAttribute('data-remove-img'));
        const srcs = getImageSrcs().filter((_, i) => i !== idx);
        renderImageCards(srcs);
      });

      toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cmd]');
        if (!btn) return;
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline') {
          editor.focus();
          document.execCommand(cmd, false, null);
        } else if (cmd === 'highlight') {
          applyHighlight();
        } else if (cmd === 'image') {
          $('#dsNoteImageInput')?.click();
        }
      });

      const fileInput = $('#dsNoteImageInput');
      fileInput?.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 1.5 * 1024 * 1024) {
          toast(state.lang === 'fa' ? 'حجم تصویر باید کمتر از ۱.۵ مگابایت باشد.' : 'Image must be smaller than 1.5 MB.');
          fileInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          // compress via canvas for storage reliability
          const img = new Image();
          img.onload = () => {
            try {
              const maxW = 1280;
              const scale = Math.min(1, maxW / Math.max(1, img.width));
              const w = Math.max(1, Math.round(img.width * scale));
              const h = Math.max(1, Math.round(img.height * scale));
              const canvas = document.createElement('canvas');
              canvas.width = w; canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              const data = canvas.toDataURL('image/jpeg', 0.82);
              const srcs = getImageSrcs();
              srcs.push(data);
              renderImageCards(srcs);
            } catch (_) {
              const srcs = getImageSrcs();
              srcs.push(String(reader.result || ''));
              renderImageCards(srcs);
            }
          };
          img.onerror = () => {
            const srcs = getImageSrcs();
            srcs.push(String(reader.result || ''));
            renderImageCards(srcs);
          };
          img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
      });
    })();
$('#dsNoteCancel')?.addEventListener('click',()=>{resetNoteForm();});

    $('#dsSearchInput').addEventListener('input',event=>{state.searchText=event.target.value;renderTaskLists();if(state.searchText.trim())switchView('tasks');});
    $('#dsSearchInput').addEventListener('keydown',event=>{if(event.key==='Escape'){event.currentTarget.value='';state.searchText='';renderTaskLists();$('#dsSearchToggle').setAttribute('aria-expanded','false');$('#dsSearchToggle').focus();}});
    function readFocusDurationSeconds(){
      const h = Math.max(0, Math.min(12, Math.floor(Number($('#dsFocusHours')?.value) || 0)));
      const m = Math.max(0, Math.min(59, Math.floor(Number($('#dsFocusMinutes')?.value) || 0)));
      const s = Math.max(0, Math.min(59, Math.floor(Number($('#dsFocusSeconds')?.value) || 0)));
      let total = h*3600 + m*60 + s;
      if (total < 1) total = 60; // at least 1 minute if all zero
      return total;
    }
    function writeFocusDurationInputs(totalSec){
      const t = Math.max(0, totalSec|0);
      const h = Math.floor(t/3600);
      const m = Math.floor((t%3600)/60);
      const s = t%60;
      const hi=$('#dsFocusHours'), mi=$('#dsFocusMinutes'), si=$('#dsFocusSeconds');
      if(hi) hi.value=String(h);
      if(mi) mi.value=String(m);
      if(si) si.value=String(s);
    }
    function applyFocusDurationFromInputs(){
      if(state.focusRunning) return;
      const total = readFocusDurationSeconds();
      state.focusSeconds = total;
      state.focusMinutes = Math.max(1, Math.round(total/60)); // keep ring baseline
      state.focusTotalSeconds = total;
      write('mathmateDarsyarFocusMin', String(state.focusMinutes));
      write('mathmateDarsyarFocusSec', String(total));
      writeFocusDurationInputs(total);
      renderFocusClock();
    }
    // restore duration
    try {
      const savedSec = Number(read('mathmateDarsyarFocusSec',''));
      if (Number.isFinite(savedSec) && savedSec > 0) {
        state.focusSeconds = savedSec;
        state.focusTotalSeconds = savedSec;
        state.focusMinutes = Math.max(1, Math.round(savedSec/60));
      } else {
        state.focusSeconds = state.focusMinutes * 60;
        state.focusTotalSeconds = state.focusSeconds;
      }
    } catch(_) {
      state.focusSeconds = state.focusMinutes * 60;
      state.focusTotalSeconds = state.focusSeconds;
    }
    writeFocusDurationInputs(state.focusSeconds);
    ['dsFocusHours','dsFocusMinutes','dsFocusSeconds'].forEach(id=>{
      const el=$( '#'+id );
      if(!el) return;
      el.addEventListener('change', applyFocusDurationFromInputs);
      el.addEventListener('input', ()=>{ if(!state.focusRunning) applyFocusDurationFromInputs(); });
    });
    const focusInputs = ()=>['dsFocusHours','dsFocusMinutes','dsFocusSeconds'].map(id=>$('#'+id)).filter(Boolean);
    $('#dsFocusToggle').addEventListener('click',()=>{
      if(state.focusRunning){clearInterval(state.focusInterval);state.focusInterval=null;state.focusRunning=false;$('#dsFocusToggle').innerHTML=`${icon('clock')}<span data-fa="ادامهٔ تمرکز" data-en="Resume focus">${state.lang==='fa'?'ادامهٔ تمرکز':'Resume focus'}</span>`;return;}
      if(state.focusSeconds<=0){ applyFocusDurationFromInputs(); }
      state.focusTotalSeconds = Math.max(1, state.focusSeconds || readFocusDurationSeconds());
      state.focusRunning=true; focusInputs().forEach(el=>el.disabled=true);
      $('#dsFocusToggle').innerHTML=`${icon('clock')}<span>${state.lang==='fa'?'توقف':'Pause'}</span>`;
      state.focusInterval=setInterval(()=>{state.focusSeconds=Math.max(0,state.focusSeconds-1);renderFocusClock();if(state.focusSeconds<=0){clearInterval(state.focusInterval);state.focusInterval=null;state.focusRunning=false; focusInputs().forEach(el=>el.disabled=false);$('#dsFocusToggle').innerHTML=`${icon('clock')}<span data-fa="شروع دوباره" data-en="Restart">${state.lang==='fa'?'شروع دوباره':'Restart'}</span>`;toast(state.lang==='fa'?'زمان تمرکز به پایان رسید؛ کمی استراحت کن!':'Focus time finished. Take a short break!');}},1000);
    });
    $('#dsFocusReset').addEventListener('click',()=>{if(state.focusInterval)clearInterval(state.focusInterval);state.focusInterval=null;state.focusRunning=false; focusInputs().forEach(el=>el.disabled=false); applyFocusDurationFromInputs(); renderFocusClock();$('#dsFocusToggle').innerHTML=`${icon('clock')}<span data-fa="شروع تمرکز" data-en="Start focus">${state.lang==='fa'?'شروع تمرکز':'Start focus'}</span>`;});

    // Custom priority dropdown (glass + animated, like Sudoku difficulty)
    (function wirePriorityDropdown(){
      const wrap=$('#dsPriorityWrap');
      const select=$('#dsTaskPriority');
      const trigger=$('#dsPriorityTrigger');
      const menu=$('#dsPriorityMenu');
      const valueEl=$('#dsPriorityValue');
      if(!wrap||!select||!trigger||!menu||!valueEl) return;
      if(wrap.dataset.mmPriorityReady==='1') return;
      wrap.dataset.mmPriorityReady='1';
      // never use HTML hidden — it fights CSS animation (display:none)
      menu.removeAttribute('hidden');
      const labels=()=>({
        low: state.lang==='fa'?'کم':'Low',
        medium: state.lang==='fa'?'معمولی':'Medium',
        high: state.lang==='fa'?'زیاد':'High'
      });
      function sync(){
        const L=labels();
        const v=select.value||'medium';
        valueEl.textContent=L[v]||v;
        menu.querySelectorAll('.ds-priority-option').forEach(btn=>{
          const on=btn.dataset.value===v;
          btn.classList.toggle('is-selected', on);
          btn.setAttribute('aria-selected', String(on));
          btn.textContent=L[btn.dataset.value]||btn.dataset.value;
        });
      }
      function close(){
        wrap.classList.remove('is-open');
        trigger.setAttribute('aria-expanded','false');
      }
      function open(){
        wrap.classList.add('is-open');
        trigger.setAttribute('aria-expanded','true');
      }
      trigger.addEventListener('click', e=>{
        e.preventDefault();
        e.stopPropagation();
        if(wrap.classList.contains('is-open')) close(); else open();
      });
      menu.addEventListener('click', e=>{
        e.stopPropagation();
        const btn=e.target.closest('.ds-priority-option');
        if(!btn) return;
        select.value=btn.dataset.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        sync();
        close();
      });
      // close only on outside clicks — bubble phase so trigger click can open first
      document.addEventListener('click', e=>{
        if(!wrap.contains(e.target)) close();
      });
      sync();
      window.__dsSyncPriorityLabels = sync;
    })();

    renderLiveClock();
    if(window.__dsLiveClockTimer) clearInterval(window.__dsLiveClockTimer);
    window.__dsLiveClockTimer=setInterval(renderLiveClock, 1000);
    renderFocusClock();

    function renderFocusClock(){
      const total=Math.max(0, state.focusSeconds|0);
      const hrs=Math.floor(total/3600);
      const min=Math.floor((total%3600)/60);
      const sec=total%60;
      const fmt=n=>String(n).padStart(2,'0');
      const el=$('#dsFocusClock');
      if(el) el.textContent=`${fmt(hrs)}:${fmt(min)}:${fmt(sec)}`;
      const ring=$('#dsFocusRingProgress');
      if(ring){
        const full=Math.max(1, state.focusTotalSeconds || state.focusMinutes*60 || 1);
        const remaining=Math.max(0, total);
        const progress=Math.min(100, Math.max(0, (remaining/full)*100));
        ring.style.strokeDashoffset=String(100-progress);
      }
    }
    function renderLiveClock(){
      const now=new Date();
      const fmt=n=>String(n).padStart(2,'0');
      const el=$('#dsLiveClockTime');
      if(el) el.textContent=`${fmt(now.getHours())}:${fmt(now.getMinutes())}:${fmt(now.getSeconds())}`;
      const label=$('#dsLiveClockLabel');
      if(label) label.textContent=state.lang==='fa'?'ساعت · دقیقه · ثانیه':'hour · min · sec';
    }

    // Shared settings flow: host settings are the canonical source of truth.
    window.addEventListener('mathmate:host-settings',event=>applyHostSettings(event.detail||{}));
    window.addEventListener('mathmate:settings-changed',()=>window.dispatchEvent(new Event('mathmate:settings-ping')));
    window.addEventListener('storage',event=>{
      if(['mathmateTheme','mathmateColorTheme','mathmateFontSize','mathmateLang','mathmateAnimations'].includes(event.key)){
        const map={theme:read('mathmateTheme','light'),colorTheme:read('mathmateColorTheme','instagram'),fontSize:read('mathmateFontSize','normal'),language:read('mathmateLang','fa'),animations:read('mathmateAnimations','on')!=='off'};
        applyHostSettings(map);
      }
      if(event.key==='mathmateName'){state.profileName=(event.newValue||'').slice(0,50);renderGreeting();renderProfile();}
    });
    const dueInit=$('#dsTaskDueDate'); if(dueInit){ dueInit.value=dateKey(today); dueInit.dataset.mmIsoDate=dateKey(today); }
    renderNotesPreview();

    // Build avatars once as image-backed SVGs; the same URL is shared with MathMate's account area.
    state.draftAvatar = read('mathmateAvatar','') || makeAvatar('🎓','#6c63ff');
    if(!state.draftAvatar.startsWith('data:image/') && !state.draftAvatar.startsWith('assets/')) state.draftAvatar=makeAvatar('🎓','#6c63ff');
    if(state.draftAvatar.startsWith('assets/')) { /* Use the existing website avatar path as-is when present. */ }
    renderProfile();
    applyHostSettings({
      theme:read('mathmateTheme','light'),colorTheme:read('mathmateColorTheme','instagram'),fontSize:read('mathmateFontSize','normal'),
      language:read('mathmateLang',state.lang),animations:read('mathmateAnimations','on')!=='off'
    });
    switchView('dashboard');
    if (typeof hostState?.markReady === 'function') hostState.markReady();
    else app.dataset.darsyarReady='true';
    // Notify the host after the shadow root and setting listener are both ready.
    window.dispatchEvent(new Event('mathmate:settings-changed'));
  };

  if (mount.shadowRoot && (window.__mathMateDarsyarHost?.app || mount.shadowRoot.querySelector('.darsyar-app'))) start();
  else document.addEventListener('DOMContentLoaded', start, { once:true });
})();
