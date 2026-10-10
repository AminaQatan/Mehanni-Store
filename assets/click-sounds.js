(() => {
  const button = document.getElementById('sound-toggle');
  const label = document.getElementById('sound-label');
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const preferenceKey = 'mehanni-click-sounds';
  let enabled = true;
  let audioContext;
  try { enabled = localStorage.getItem(preferenceKey) !== 'off'; } catch (_) {}

  function updateButton() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Mute click sounds' : 'Enable click sounds');
    button.title = enabled ? 'Mute click sounds' : 'Enable click sounds';
    button.classList.toggle('muted', !enabled);
    label.textContent = enabled ? 'Sound on' : 'Sound off';
  }

  function makePop() {
    if (!enabled || !audioContext || audioContext.state !== 'running') return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(760, now);
    oscillator.frequency.exponentialRampToValueAtTime(310, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(now);
    oscillator.stop(now + 0.14);
  }

  function playPop() {
    if (!enabled || !AudioEngine) return;
    try {
      if (!audioContext || audioContext.state === 'closed') audioContext = new AudioEngine();
      if (audioContext.state === 'suspended') audioContext.resume().then(makePop).catch(() => {});
      else makePop();
    } catch (_) { /* A blocked audio device must not interrupt navigation. */ }
  }

  updateButton();
  if (!AudioEngine) {
    button.disabled = true;
    button.title = 'Click sounds are unavailable in this browser';
    button.setAttribute('aria-label', button.title);
    label.textContent = 'Sound unavailable';
    return;
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(preferenceKey, enabled ? 'on' : 'off'); } catch (_) {}
    updateButton();
    if (enabled) playPop();
  });

  document.addEventListener('mehanni:timer-finished', () => {
    playPop();
    setTimeout(playPop, 180);
    setTimeout(playPop, 360);
  });

  // Native click events cover mouse, touch and keyboard activation.
  document.addEventListener('click', event => {
    const control = event.target instanceof Element
      ? event.target.closest('a[href], button, select, summary, [role="button"], input[type="checkbox"], input[type="radio"]')
      : null;
    if (!control || control === button || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
    playPop();
  }, true);
})();
