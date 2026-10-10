(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MehanniBoard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
  function bounds(points) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    points.forEach(p => { left = Math.min(left, p.x); top = Math.min(top, p.y); right = Math.max(right, p.x); bottom = Math.max(bottom, p.y); });
    return { x: left, y: top, width: right - left, height: bottom - top };
  }
  function lineDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const t = length ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / length, 0, 1) : 0;
    return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
  }
  function simplify(points, tolerance) {
    if (points.length < 3) return points.slice();
    let farthest = 0, max = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const d = lineDistance(points[i], points[0], points.at(-1));
      if (d > max) { max = d; farthest = i; }
    }
    if (max <= tolerance) return [points[0], points.at(-1)];
    return simplify(points.slice(0, farthest + 1), tolerance).slice(0, -1).concat(simplify(points.slice(farthest), tolerance));
  }
  function resample(points, samples = 80) {
    const cumulative = [0];
    for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + distance(points[i - 1], points[i]));
    const length = cumulative.at(-1);
    if (!length) return points.slice(0, 1);
    const result = []; let segment = 1;
    for (let i = 0; i < samples; i++) {
      const target = length * i / (samples - 1);
      while (segment < points.length - 1 && cumulative[segment] < target) segment++;
      const a = points[segment - 1], b = points[segment];
      const t = (target - cumulative[segment - 1]) / (cumulative[segment] - cumulative[segment - 1] || 1);
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return result;
  }
  function recognise(input) {
    const points = resample(input);
    if (points.length < 3) return null;
    const box = bounds(points), diagonal = Math.hypot(box.width, box.height);
    if (diagonal < 18) return null;
    const start = points[0], end = points.at(-1), gap = distance(start, end);
    const length = points.slice(1).reduce((total, p, i) => total + distance(points[i], p), 0);
    if (gap > diagonal * .7 && length < gap * 1.18 && Math.max(...points.map(p => lineDistance(p, start, end))) < diagonal * .075) {
      return { type: 'line', start, end, box };
    }
    if (gap > diagonal * .32 || Math.min(box.width, box.height) < 15 || length < diagonal * 1.6) return null;
    const closed = points.concat([start]);
    let vertices = simplify(closed, diagonal * .055).slice(0, -1);
    if (vertices.length > 3 && lineDistance(vertices[0], vertices.at(-1), vertices[1]) < diagonal * .055) vertices = vertices.slice(1);
    if (vertices.length === 3) return { type: 'triangle', vertices, box };
    const rx = box.width / 2, ry = box.height / 2, cx = box.x + rx, cy = box.y + ry;
    let ellipseError = 0, rectangleError = 0;
    points.forEach(p => {
      ellipseError += Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1) * Math.min(rx, ry);
      rectangleError += Math.min(Math.abs(p.x - box.x), Math.abs(p.x - box.x - box.width), Math.abs(p.y - box.y), Math.abs(p.y - box.y - box.height));
    });
    ellipseError /= points.length; rectangleError /= points.length;
    if (rectangleError < diagonal * .045 && rectangleError < ellipseError * .8) return { type: 'rectangle', box };
    if (ellipseError < diagonal * .055) return { type: 'ellipse', box };
    return null;
  }
  function shapeFromDrag(type, start, end) {
    const box = bounds([start, end]);
    return { type, start, end, box };
  }
  function wrapText(text, width, measure) {
    const lines = [];
    String(text).replace(/\r/g, '').split('\n').forEach(paragraph => {
      if (!paragraph.trim()) { lines.push(''); return; }
      let line = '';
      for (const word of paragraph.trim().split(/\s+/)) {
        const candidate = line ? line + ' ' + word : word;
        if (measure(candidate) <= width) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        for (const char of Array.from(word)) {
          if (line && measure(line + char) > width) { lines.push(line); line = ''; }
          line += char;
        }
      }
      lines.push(line);
    });
    return lines;
  }
  function textBox(lines, measure, lineHeight, position, canvasWidth, canvasHeight) {
    const width = Math.min(canvasWidth - 32, Math.max(1, ...lines.map(measure)));
    const height = Math.min(canvasHeight - 32, Math.max(lineHeight, lines.length * lineHeight));
    return { x: clamp(position.x, 16, canvasWidth - width - 16), y: clamp(position.y, 16, canvasHeight - height - 16), width, height };
  }
  return { bounds, distance, clamp, recognise, shapeFromDrag, wrapText, textBox };
});
