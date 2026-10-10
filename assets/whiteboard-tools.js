window.setupMehanniWhiteboard = function () {
  'use strict';
  const $ = id => document.getElementById(id), board = window.MehanniBoard;
  const panel = $('panel-whiteboard'), canvas = $('whiteboard-canvas'), ctx = canvas.getContext('2d');
  if (!ctx) {
    $('board-status').textContent = 'Drawing is unavailable in this browser.';
    panel.querySelectorAll('button,input,select,textarea').forEach(control => { control.disabled = true; }); return;
  }
  const history = [], modes = ['pen', 'auto', 'text', 'eraser'];
  const fonts = { rounded: '"Trebuchet MS", Arial, sans-serif', classic: 'Georgia, "Times New Roman", serif', handwritten: '"Comic Sans MS", "Trebuchet MS", cursive' };
  let colour = '#326453', mode = 'pen', pointer = null, points = [], lastPoint, baseImage, bold = false;
  canvas.tabIndex = 0;
  function status(text) { $('board-status').textContent = text; }
  function blank() { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  function checkpoint() {
    if (history.length >= 12) history.shift();
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.push(snapshot); $('board-undo').disabled = false; return snapshot;
  }
  function setMode(next) {
    mode = next;
    modes.forEach(name => $('board-' + name).setAttribute('aria-pressed', String(mode === name)));
    $('board-auto-options').hidden = mode !== 'auto'; $('board-text-options').hidden = mode !== 'text';
    canvas.style.cursor = mode === 'text' ? 'text' : 'crosshair';
    $('board-mode-hint').textContent = {
      pen: 'Pen: draw freely with your mouse, finger or stylus.',
      auto: 'Auto-draw: sketch a simple shape, or choose one above and drag to draw it.',
      text: 'Type text: write above, choose a style, then tap the board to place it.',
      eraser: 'Eraser: rub over anything you want to remove.'
    }[mode];
    if (mode === 'text') $('board-text-input').focus();
    status('');
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    // Exclude the canvas border so touch coordinates align with drawing pixels.
    const borderX = canvas.clientLeft || 0, borderY = canvas.clientTop || 0;
    return {
      x: board.clamp((event.clientX - rect.left - borderX) * canvas.width / (rect.width - borderX * 2), 0, canvas.width),
      y: board.clamp((event.clientY - rect.top - borderY) * canvas.height / (rect.height - borderY * 2), 0, canvas.height)
    };
  }
  function drawStroke(from, to) {
    ctx.save(); ctx.lineWidth = Number($('board-width').value) * (mode === 'eraser' ? 4 : 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = mode === 'eraser' ? '#fff' : colour;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.restore();
  }
  function drawShape(shape) {
    const b = shape.box, cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    ctx.save(); ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = Number($('board-width').value);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
    if (shape.type === 'line' || shape.type === 'arrow') {
      const { start, end } = shape; ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
      if (shape.type === 'arrow') {
        const angle = Math.atan2(end.y - start.y, end.x - start.x), head = Math.min(board.distance(start, end) * .35, Math.max(20, ctx.lineWidth * 4));
        ctx.moveTo(end.x - head * Math.cos(angle - Math.PI / 6), end.y - head * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(end.x - head * Math.cos(angle + Math.PI / 6), end.y - head * Math.sin(angle + Math.PI / 6));
      }
    } else if (shape.type === 'rectangle') ctx.rect(b.x, b.y, b.width, b.height);
    else if (shape.type === 'ellipse') ctx.ellipse(cx, cy, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
    else if (shape.type === 'triangle') {
      const vertices = shape.vertices || [{ x: cx, y: b.y }, { x: b.x + b.width, y: b.y + b.height }, { x: b.x, y: b.y + b.height }];
      vertices.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    } else if (shape.type === 'star') {
      for (let i = 0; i < 10; i++) {
        const angle = i * Math.PI / 5 - Math.PI / 2, scale = i % 2 ? .43 : 1;
        const x = cx + Math.cos(angle) * b.width / 2 * scale, y = cy + Math.sin(angle) * b.height / 2 * scale;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
    }
    if ($('board-fill').checked && !['line', 'arrow'].includes(shape.type)) { ctx.globalAlpha = .22; ctx.fill(); ctx.globalAlpha = 1; }
    ctx.stroke(); ctx.restore();
  }
  function addText(position, centred = false) {
    const text = $('board-text-input').value.trim();
    if (!text) { status('Type your text first, then tap the board.'); $('board-text-input').focus(); return; }
    if (text.split('\n').length > 12) { status('Please use up to 12 lines of text, then add another text block if needed.'); $('board-text-input').focus(); return; }
    const requestedSize = Number($('board-text-size').value), font = fonts[$('board-font').value] || fonts.rounded;
    let size = requestedSize, lines, lineHeight;
    ctx.save();
    do {
      ctx.font = (bold ? 'bold ' : '') + size + 'px ' + font;
      lineHeight = size * 1.3;
      lines = board.wrapText(text, canvas.width - 64, line => ctx.measureText(line).width);
      if (lines.length * lineHeight <= canvas.height - 32 || size <= 12) break;
      size -= 2;
    } while (true);
    let box = board.textBox(lines, line => ctx.measureText(line).width, lineHeight, position, canvas.width, canvas.height);
    if (centred) box = { ...box, x: (canvas.width - box.width) / 2, y: (canvas.height - box.height) / 2 };
    checkpoint(); ctx.fillStyle = colour; ctx.textBaseline = 'top';
    const firstLetter = text.match(/\p{L}/u)?.[0] || '';
    const rtl = /[\u0590-\u08ff]/.test(firstLetter);
    ctx.direction = rtl ? 'rtl' : 'ltr'; ctx.textAlign = rtl ? 'right' : 'left';
    lines.forEach((line, index) => ctx.fillText(line, rtl ? box.x + box.width : box.x, box.y + index * lineHeight));
    ctx.restore(); status('Text added. Use Undo to remove it.' + (size < requestedSize ? ' Long text was reduced to fit the board.' : ''));
  }
  function previewShape(end) {
    ctx.putImageData(baseImage, 0, 0);
    drawShape(board.shapeFromDrag($('board-shape').value, points[0], end));
  }
  blank(); setMode('pen');
  canvas.addEventListener('pointerdown', event => {
    if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    const start = point(event);
    if (mode === 'text') { addText(start); return; }
    canvas.focus({ preventScroll: true });
    baseImage = checkpoint(); pointer = event.pointerId; canvas.setPointerCapture(pointer);
    points = [start]; lastPoint = start; status('');
    if (mode !== 'auto' || $('board-shape').value === 'auto') drawStroke(start, { x: start.x + .01, y: start.y + .01 });
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    event.preventDefault(); const next = point(event); points.push(next);
    if (mode === 'auto' && $('board-shape').value !== 'auto') previewShape(next);
    else drawStroke(lastPoint, next);
    lastPoint = next;
  });
  function finishDrawing(event, cancel = false) {
    if (event.pointerId !== pointer) return;
    const captured = pointer; pointer = null;
    if (cancel) {
      ctx.putImageData(baseImage, 0, 0); history.pop(); $('board-undo').disabled = history.length === 0; status('Drawing cancelled.');
    } else if (mode === 'auto') {
      if ($('board-shape').value === 'auto') {
        const shape = board.recognise(points);
        if (shape) {
          ctx.putImageData(baseImage, 0, 0); drawShape(shape);
          status('Tidied your ' + ({ ellipse: 'circle / oval', rectangle: 'box' }[shape.type] || shape.type) + '. Choose a shape above for more control.');
        } else status('Kept your sketch. Try a circle, box, triangle or line, or choose a shape above.');
      } else {
        let end = point(event);
        if (board.distance(points[0], end) < 6) {
          const start = { x: board.clamp(points[0].x - 90, 12, canvas.width - 192), y: board.clamp(points[0].y - 65, 12, canvas.height - 142) };
          points[0] = start; end = { x: start.x + 180, y: start.y + 130 };
        }
        previewShape(end); status('Shape added. Use Undo to remove it.');
      }
    }
    if (canvas.hasPointerCapture(captured)) canvas.releasePointerCapture(captured);
    baseImage = null; points = [];
  }
  canvas.addEventListener('pointerup', event => finishDrawing(event));
  canvas.addEventListener('pointercancel', event => finishDrawing(event, true));
  canvas.addEventListener('lostpointercapture', event => { if (event.pointerId === pointer) finishDrawing(event, true); });
  modes.forEach(name => $('board-' + name).addEventListener('click', () => setMode(name)));
  panel.querySelectorAll('[data-board-color]').forEach(button => button.addEventListener('click', () => {
    colour = button.dataset.boardColor;
    if (mode === 'eraser') setMode('pen');
    panel.querySelectorAll('[data-board-color]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('board-text-input').style.color = colour;
  }));
  function updateShapeOptions() {
    const auto = $('board-shape').value === 'auto'; $('board-add-shape').disabled = auto;
    $('board-fill').disabled = ['line', 'arrow'].includes($('board-shape').value);
    $('board-auto-help').textContent = auto
      ? 'Sketch a circle, box, triangle or line in one stroke. Auto-draw will tidy it when you lift your finger.'
      : 'Drag across the board to choose the size, tap to place a small shape, or add one to the centre.';
  }
  $('board-shape').addEventListener('change', updateShapeOptions); updateShapeOptions();
  $('board-add-shape').addEventListener('click', () => {
    if ($('board-shape').value === 'auto') return;
    checkpoint(); drawShape(board.shapeFromDrag($('board-shape').value, { x: 420, y: 255 }, { x: 780, y: 495 }));
    status('Shape added in the centre. Use Undo to remove it.');
  });
  function updateTextStyle() {
    $('board-text-input').style.fontFamily = fonts[$('board-font').value];
    $('board-text-input').style.fontWeight = bold ? 'bold' : 'normal';
  }
  $('board-font').addEventListener('change', updateTextStyle);
  $('board-text-bold').addEventListener('click', () => { bold = !bold; $('board-text-bold').setAttribute('aria-pressed', String(bold)); updateTextStyle(); });
  $('board-add-text').addEventListener('click', () => addText({ x: 16, y: 16 }, true));
  function undo() {
    if (pointer !== null) return;
    if (history.length) ctx.putImageData(history.pop(), 0, 0);
    $('board-undo').disabled = history.length === 0; status('Last change undone.');
  }
  $('board-undo').addEventListener('click', undo);
  panel.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
      event.preventDefault(); undo();
    }
  });
  $('board-clear').addEventListener('click', () => { checkpoint(); blank(); status('Board cleared. Use Undo to bring everything back.'); });
  $('board-download').addEventListener('click', () => canvas.toBlob(blob => {
    if (!blob) { status('The board could not be saved. Please try again.'); return; }
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'mehanni-whiteboard-' + window.MehanniTools.dateKey(new Date()) + '.png';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('Your PNG with drawings and text is ready. Check your downloads.');
  }, 'image/png'));
};
