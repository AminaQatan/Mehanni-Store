(() => {
  'use strict';
  const core = window.MehanniTools;
  const $ = id => document.getElementById(id);
  const modal = $('tools-modal');
  const tabs = [...modal.querySelectorAll('[data-tool-tab]')];
  let activeTool = 'calendar', toolOpener;
  function selectTool(name, focus = false) {
    if (!tabs.some(tab => tab.dataset.toolTab === name)) return;
    activeTool = name;
    modal.scrollTop = 0;
    tabs.forEach(tab => {
      const selected = tab.dataset.toolTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      $('panel-' + tab.dataset.toolTab).hidden = !selected;
      if (selected && focus) { tab.focus(); tab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    });
    if (name === 'calendar') updateClock();
  }
  document.querySelectorAll('[data-open-tool]').forEach(button => button.addEventListener('click', () => {
    toolOpener = button;
    selectTool(button.dataset.openTool);
    modal.showModal();
    document.body.style.overflow = 'hidden';
    $('tab-' + activeTool).focus();
  }));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTool(tab.dataset.toolTab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTool(tabs[next].dataset.toolTab, true); }
    });
  });
  $('close-tools').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  });
  modal.addEventListener('close', () => {
    document.body.style.overflow = '';
    if (toolOpener && !toolOpener.hidden) toolOpener.focus();
    else document.querySelector('[data-open-tool="' + activeTool + '"]').focus();
  });

  // Calendar: local dates, including day/month changes while the page is open.
  let selectedDate = new Date(), shownMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  let followingToday = true, lastTodayKey = core.dateKey(selectedDate);
  const longDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  function showSelectedDate() {
    $('calendar-selected-weekday').textContent = selectedDate.toLocaleDateString(undefined, { weekday: 'long' });
    $('calendar-selected-day').textContent = selectedDate.getDate();
    $('calendar-selected-month').textContent = selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  function renderCalendar() {
    const today = core.dateKey(new Date()), selected = core.dateKey(selectedDate);
    $('calendar-month').textContent = shownMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    $('calendar-days').replaceChildren();
    core.monthCells(shownMonth.getFullYear(), shownMonth.getMonth()).forEach(date => {
      if (!date) { const blank = document.createElement('span'); blank.setAttribute('aria-hidden', 'true'); $('calendar-days').append(blank); return; }
      const key = core.dateKey(date), button = document.createElement('button');
      button.type = 'button'; button.className = 'calendar-day'; button.textContent = date.getDate();
      button.classList.toggle('today', key === today);
      button.setAttribute('aria-label', date.toLocaleDateString(undefined, longDate) + (key === today ? ', today' : ''));
      button.setAttribute('aria-pressed', String(key === selected));
      if (key === today) button.setAttribute('aria-current', 'date');
      button.addEventListener('click', () => {
        selectedDate = date; followingToday = key === core.dateKey(new Date());
        renderCalendar();
        const selectedButton = $('calendar-days').querySelector('[aria-pressed="true"]');
        if (selectedButton) selectedButton.focus();
      });
      $('calendar-days').append(button);
    });
    showSelectedDate();
  }
  function updateClock() {
    const now = new Date(), key = core.dateKey(now);
    $('calendar-clock').textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('calendar-clock').dateTime = now.toISOString();
    $('calendar-local-date').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (key !== lastTodayKey) {
      lastTodayKey = key;
      if (followingToday) { selectedDate = now; shownMonth = new Date(now.getFullYear(), now.getMonth(), 1); }
      renderCalendar();
    }
  }
  [-1, 1].forEach(direction => $(direction < 0 ? 'calendar-prev' : 'calendar-next').addEventListener('click', () => {
    followingToday = false;
    shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + direction, 1);
    renderCalendar();
  }));
  $('calendar-today').addEventListener('click', () => {
    selectedDate = new Date(); shownMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    followingToday = true; renderCalendar(); updateClock();
  });
  renderCalendar(); updateClock();
  setInterval(() => { if (modal.open && activeTool === 'calendar') updateClock(); }, 1000);

  // Calculator: explicit arithmetic parser; user input is never evaluated as code.
  let expression = '', justCalculated = false, calcError = false;
  function calcInput(key) {
    $('calc-status').textContent = '';
    if (key === 'clear') { expression = ''; justCalculated = false; calcError = false; }
    else if (key === 'backspace') { expression = expression.slice(0, -1); justCalculated = false; calcError = false; }
    else if (key === 'equals') {
      try {
        const original = expression;
        expression = String(core.calculate(expression)); justCalculated = true; calcError = false;
        $('calc-status').textContent = original + ' = ' + expression;
      } catch (error) { $('calc-status').textContent = error.message; calcError = true; }
    } else if (/^[0-9.+×÷−%()\-*/]$/.test(key)) {
      if ((justCalculated || calcError) && /[0-9.(]/.test(key)) expression = '';
      justCalculated = false; calcError = false;
      if (expression.length < 200) expression += key.replace('*', '×').replace('/', '÷').replace('-', '−');
    }
    $('calc-display').value = expression || '0';
    $('calc-display').scrollLeft = $('calc-display').scrollWidth;
  }
  modal.querySelectorAll('[data-calc]').forEach(button => button.addEventListener('click', () => calcInput(button.dataset.calc)));
  modal.addEventListener('keydown', event => {
    if (activeTool !== 'calculator' || event.ctrlKey || event.metaKey || event.altKey) return;
    // Preserve Enter/Space activation for focused buttons and the tab bar.
    if (event.key === 'Enter' && event.target.tagName === 'BUTTON') return;
    let key = event.key;
    if (key === 'Enter' || key === '=') key = 'equals';
    else if (key === 'Backspace') key = 'backspace';
    else if (key === 'Delete') key = 'clear';
    else if (!/^[0-9.+%()\-*/]$/.test(key)) return;
    event.preventDefault(); $('calc-display').focus(); calcInput(key);
  });

  // Sticky notes: plain text stored only in this browser.
  const noteKey = 'mehanni-notes-v1', colours = ['yellow', 'mint', 'lilac', 'peach'];
  let notes = [], deletedNote, saveDelay;
  try {
    const stored = JSON.parse(localStorage.getItem(noteKey) || '[]');
    if (Array.isArray(stored)) notes = stored.slice(0, 30).filter(note => note && typeof note.text === 'string').map((note, i) => ({
      id: 'restored-' + i, text: note.text.slice(0, 2000), colour: colours.includes(note.colour) ? note.colour : 'yellow'
    }));
  } catch (_) { $('notes-save-status').textContent = 'Start a note here. Saving may be unavailable.'; }
  function saveNotes() {
    clearTimeout(saveDelay);
    try { localStorage.setItem(noteKey, JSON.stringify(notes)); $('notes-save-status').textContent = 'Saved on this device'; }
    catch (_) { $('notes-save-status').textContent = 'Could not save. Keep this page open and copy your notes.'; }
  }
  function renderNotes(focusId) {
    const grid = $('sticky-grid'); grid.replaceChildren();
    $('add-note').disabled = notes.length >= 30;
    if (!notes.length) {
      const empty = document.createElement('p'); empty.className = 'notes-empty';
      empty.textContent = 'Your next bright idea belongs here. Add your first note!'; grid.append(empty);
    }
    notes.forEach((note, index) => {
      const card = document.createElement('article'); card.className = 'sticky-note'; card.dataset.color = note.colour;
      const text = document.createElement('textarea'); text.value = note.text; text.maxLength = 2000;
      text.placeholder = 'A little idea…'; text.setAttribute('aria-label', 'Note ' + (index + 1));
      const footer = document.createElement('div'); footer.className = 'sticky-note-footer';
      const colour = document.createElement('select'); colour.setAttribute('aria-label', 'Colour for note ' + (index + 1));
      colours.forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name[0].toUpperCase() + name.slice(1); colour.append(option); });
      colour.value = note.colour;
      colour.addEventListener('change', () => { note.colour = colour.value; card.dataset.color = colour.value; saveNotes(); });
      const count = document.createElement('span'); count.className = 'note-limit'; count.textContent = note.text.length + '/2000';
      text.addEventListener('input', () => {
        note.text = text.value; count.textContent = note.text.length + '/2000'; $('notes-save-status').textContent = 'Saving…';
        clearTimeout(saveDelay); saveDelay = setTimeout(saveNotes, 250);
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'note-delete'; remove.textContent = '×';
      remove.setAttribute('aria-label', 'Remove note ' + (index + 1));
      remove.addEventListener('click', () => {
        deletedNote = { note, index }; notes = notes.filter(item => item.id !== note.id);
        saveNotes(); renderNotes(); $('notes-undo').hidden = false; $('undo-note').focus();
      });
      footer.append(colour, count, remove); card.append(text, footer); grid.append(card);
      if (note.id === focusId) text.focus();
    });
  }
  $('add-note').addEventListener('click', () => {
    if (notes.length >= 30) return;
    const id = 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    notes.push({ id, text: '', colour: colours[notes.length % colours.length] }); saveNotes(); renderNotes(id);
    if (notes.length >= 30) $('notes-undo').hidden = true;
  });
  $('undo-note').addEventListener('click', () => {
    if (!deletedNote || notes.length >= 30) return;
    notes.splice(Math.min(deletedNote.index, notes.length), 0, deletedNote.note);
    const id = deletedNote.note.id; deletedNote = null; $('notes-undo').hidden = true; saveNotes(); renderNotes(id);
  });
  window.addEventListener('pagehide', () => { if (saveDelay) saveNotes(); });
  renderNotes();

  window.setupMehanniWhiteboard();

  // Timer uses a deadline, so inactive-tab throttling cannot make it drift.
  const timerKey = 'mehanni-timer-v1'; let timer = core.newTimer(), timerInputsDirty = false, lastTimerStatus;
  try { timer = core.restoreTimer(JSON.parse(localStorage.getItem(timerKey)), Date.now()) || timer; } catch (_) {}
  try { $('timer-alert').checked = localStorage.getItem('mehanni-timer-alert') !== 'off'; } catch (_) {}
  $('timer-alert').addEventListener('change', () => { try { localStorage.setItem('mehanni-timer-alert', $('timer-alert').checked ? 'on' : 'off'); } catch (_) {} });
  const announcement = document.createElement('p'); announcement.className = 'sr-only'; announcement.setAttribute('role', 'status'); document.body.append(announcement);
  function saveTimer() {
    try { localStorage.setItem(timerKey, JSON.stringify(timer)); }
    catch (_) { $('timer-status').textContent = 'Keep this page open: this browser cannot save the timer.'; }
  }
  function syncTimeInputs() {
    $('timer-minutes').value = Math.floor(timer.duration / 60000); $('timer-seconds').value = (timer.duration / 1000) % 60; timerInputsDirty = false;
  }
  function updateTimerView() {
    const time = core.formatTime(timer.remaining), active = timer.status === 'running' || timer.status === 'paused';
    $('timer-display').textContent = time;
    $('timer-chip').hidden = timer.status === 'idle'; $('timer-chip-time').textContent = timer.status === 'finished' ? 'Time’s up!' : time + (timer.status === 'paused' ? ' · Paused' : '');
    $('timer-chip').classList.toggle('is-finished', timer.status === 'finished'); $('timer-face').classList.toggle('is-finished', timer.status === 'finished');
    if (timer.status !== lastTimerStatus) {
      $('timer-state').textContent = { idle: 'Ready when you are', running: 'A little time to focus', paused: 'Take a breath. You can resume.', finished: 'Time’s up! Well done.' }[timer.status];
      $('timer-start').textContent = { idle: '▶ Start timer', running: 'Ⅱ Pause', paused: '▶ Resume', finished: '↻ Start again' }[timer.status];
      lastTimerStatus = timer.status;
    }
    ['timer-minutes', 'timer-seconds', 'timer-set'].forEach(id => { $(id).disabled = active; });
    modal.querySelectorAll('[data-timer-minutes]').forEach(button => { button.disabled = active; });
  }
  function setDuration(ms) {
    timer = core.newTimer(ms); $('timer-status').textContent = ''; announcement.textContent = ''; saveTimer(); syncTimeInputs(); updateTimerView();
  }
  function applyTimeInputs() {
    const minutes = Number($('timer-minutes').value), seconds = Number($('timer-seconds').value), duration = (minutes * 60 + seconds) * 1000;
    if (!Number.isInteger(minutes) || !Number.isInteger(seconds) || minutes < 0 || seconds < 0 || seconds > 59 || duration < 1000 || duration > core.MAX_DURATION) {
      $('timer-status').textContent = 'Choose whole numbers: 1 second to 180 minutes, with seconds from 0 to 59.'; return false;
    }
    setDuration(duration); return true;
  }
  function finishTimer() {
    saveTimer(); updateTimerView(); announcement.textContent = 'Your Mehanni timer has finished. Time’s up!';
    if ($('timer-alert').checked) document.dispatchEvent(new CustomEvent('mehanni:timer-finished'));
  }
  function refreshTimer() {
    if (timer.status !== 'running') return;
    timer = core.tickTimer(timer, Date.now());
    if (timer.status === 'finished') finishTimer(); else updateTimerView();
  }
  modal.querySelectorAll('[data-timer-minutes]').forEach(button => button.addEventListener('click', () => setDuration(Number(button.dataset.timerMinutes) * 60000)));
  ['timer-minutes', 'timer-seconds'].forEach(id => $(id).addEventListener('input', () => { timerInputsDirty = true; }));
  $('timer-set').addEventListener('click', applyTimeInputs);
  $('timer-start').addEventListener('click', () => {
    if (timerInputsDirty && !applyTimeInputs()) return;
    $('timer-status').textContent = ''; announcement.textContent = '';
    if (timer.status === 'running') {
      timer = core.pauseTimer(timer, Date.now());
      if (timer.status === 'finished') { finishTimer(); return; }
    } else timer = core.startTimer(timer, Date.now());
    saveTimer(); updateTimerView();
  });
  $('timer-reset').addEventListener('click', () => setDuration(timer.duration));
  syncTimeInputs(); updateTimerView();
  setInterval(refreshTimer, 250);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { updateClock(); refreshTimer(); } });
})();
