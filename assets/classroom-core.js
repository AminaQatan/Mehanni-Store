/* Small, dependency-free helpers shared by the classroom tools. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MehanniTools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function calculate(source) {
    const text = String(source).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s/g, '');
    if (!text || text.length > 200) throw new Error('Enter a calculation first.');
    let index = 0;
    function primary() {
      let value;
      if (text[index] === '(') {
        index++;
        value = sum();
        if (text[index++] !== ')') throw new Error('Check your brackets.');
      } else {
        const match = text.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
        if (!match) throw new Error('Check your calculation.');
        index += match[0].length;
        value = Number(match[0]);
      }
      while (text[index] === '%') { value /= 100; index++; }
      return value;
    }
    function unary() {
      if (text[index] === '+') { index++; return unary(); }
      if (text[index] === '-') { index++; return -unary(); }
      return primary();
    }
    function product() {
      let value = unary();
      while (text[index] === '*' || text[index] === '/') {
        const operator = text[index++], next = unary();
        if (operator === '/' && next === 0) throw new Error('Cannot divide by zero.');
        value = operator === '*' ? value * next : value / next;
      }
      return value;
    }
    function sum() {
      let value = product();
      while (text[index] === '+' || text[index] === '-') {
        const operator = text[index++], next = product();
        value = operator === '+' ? value + next : value - next;
      }
      return value;
    }
    const result = sum();
    if (index !== text.length || !Number.isFinite(result)) throw new Error('Check your calculation.');
    return Object.is(result, -0) ? 0 : Number(result.toPrecision(12));
  }
  function dateKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }
  function monthCells(year, month) {
    const first = new Date(year, month, 1), days = new Date(year, month + 1, 0).getDate();
    const cells = Array(first.getDay()).fill(null);
    for (let day = 1; day <= days; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7) cells.push(null);
    return cells;
  }
  const MAX_DURATION = 180 * 60 * 1000;
  function newTimer(duration = 300000) {
    return { duration, remaining: duration, deadline: null, status: 'idle' };
  }
  function tickTimer(state, now) {
    if (state.status !== 'running') return { ...state };
    const remaining = Math.max(0, state.deadline - now);
    return { ...state, remaining, status: remaining === 0 ? 'finished' : 'running' };
  }
  function startTimer(state, now) {
    const remaining = state.status === 'finished' ? state.duration : state.remaining;
    return { ...state, remaining, deadline: now + remaining, status: 'running' };
  }
  function pauseTimer(state, now) {
    const current = tickTimer(state, now);
    return current.status === 'running' ? { ...current, deadline: null, status: 'paused' } : current;
  }
  function restoreTimer(data, now) {
    if (!data || !['idle', 'running', 'paused', 'finished'].includes(data.status) ||
      !Number.isFinite(data.duration) || data.duration < 1000 || data.duration > MAX_DURATION ||
      !Number.isFinite(data.remaining) || data.remaining < 0 || data.remaining > data.duration ||
      (data.status === 'running' && (!Number.isFinite(data.deadline) || data.deadline > now + data.duration + 1000))) return null;
    return tickTimer({ duration: data.duration, remaining: data.remaining, deadline: data.deadline, status: data.status }, now);
  }
  function formatTime(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  }
  return { calculate, dateKey, monthCells, newTimer, tickTimer, startTimer, pauseTimer, restoreTimer, formatTime, MAX_DURATION };
});
