/**
 * ID CARD GENERATOR
 * Generates ID Card PDFs from a JPG template
 *
 * HOW TO USE:
 *   1. Load template:   await IDCardGenerator.loadTemplate('/id-card-template.jpeg')
 *   2. Download PDF:    IDCardGenerator.download({ ...idCardData })
 *   3. Preview:         IDCardGenerator.preview({ ...idCardData })  ← blob
 *   4. Update config:   IDCardGenerator.updateConfig({ fields: { ... } })
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // CONFIGURATION — adjust positions to your JPG
  const CONFIG = {
    templatePath: 'id-card-template.jpeg',
    fields: {
      studentName:    { x: 49,   y: 49,   font: 'bold 82px serif',  color: '#000000', align: 'center' },
      sessionFrom:    { x: 49,   y: 28,   font: '60px serif',  color: '#000000', align: 'left'   },
      sessionTo:      { x: 59,   y: 28,   font: '60px serif',  color: '#000000', align: 'left'   },
      photo:          { x: 35,   y: 29.3, width: 30, height: 17 },
      fatherName:     { x: 51,   y: 55.8, font: '80px serif',  color: '#000000', align: 'left'   },
      motherName:     { x: 51,   y: 59.5, font: '80px serif',  color: '#000000', align: 'left'   },
      enrollmentNo:   { x: 51,   y: 63,   font: '80px serif',  color: '#000000', align: 'left'   },
      dateOfBirth:    { x: 51,   y: 66.7, font: '80px serif',  color: '#000000', align: 'left'   },
      contactNo:      { x: 51,   y: 70,   font: '80px serif',  color: '#000000', align: 'left'   },
      address: { x: 51, y: 74, font: '80px serif', color: '#000000', align: 'left', maxWidth: 40, lineHeight: 4.8 },
      mobileNo:       { x: 51,   y: 82.5, font: '80px serif',  color: '#000000', align: 'left'   },
      centerMobileNo: { x: 51,   y: 85.8, font: '80px serif',  color: '#000000', align: 'left'   },
    }
  };

  let _templateImg = null;
  let _canvas      = null;
  let _ctx         = null;

  function _initCanvas() {
    if (!_canvas) {
      _canvas = document.getElementById('idCardCanvas');
      if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.id = 'idCardCanvas';
        _canvas.style.display = 'none';
        document.body.appendChild(_canvas);
      }
      if (_canvas) _ctx = _canvas.getContext('2d');
    }
    return _canvas && _ctx;
  }

  function _fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _pct(val, total) { return (val / 100) * total; }

  function _drawField(field, text) {
    if (!text || !_ctx) return;
    const W = _canvas.width, H = _canvas.height;
    _ctx.save();
    _ctx.font      = field.font;
    _ctx.fillStyle = field.color;
    _ctx.textAlign = field.align || 'left';
    _ctx.fillText(text, _pct(field.x, W), _pct(field.y, H));
    _ctx.restore();
  }

  function _drawWrappedText(field, text) {
    if (!text || !_ctx) return;
    const W = _canvas.width, H = _canvas.height;
    const maxWidth   = _pct(field.maxWidth || 40, W);
    const lineHeight = _pct(field.lineHeight || 3, H);
    const x = _pct(field.x, W);
    const y = _pct(field.y, H);
    _ctx.save();
    _ctx.font      = field.font;
    _ctx.fillStyle = field.color;
    _ctx.textAlign = field.align || 'left';

    const words = text.split(' ');
    let line = '', currentY = y, lineCount = 0;
    const MAX_LINES = 2;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (_ctx.measureText(testLine).width > maxWidth && i > 0) {
        _ctx.fillText(line.trim(), x, currentY);
        lineCount++;
        if (lineCount >= MAX_LINES) break;   // hard stop at 2 lines
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (lineCount < MAX_LINES) _ctx.fillText(line.trim(), x, currentY);

    _ctx.restore();
  }

  function _resolveIDCardData(idCardOrRoll) {
    if (typeof idCardOrRoll === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const found = window.StudentDB.find(idCardOrRoll);
        if (found) return {
          studentName:    found.studentName    || found.applicantName || '',
          sessionFrom:    found.sessionFrom    || '',
          sessionTo:      found.sessionTo      || '',
          fatherName:     found.fatherName     || '',
          motherName:     found.motherName     || '',
          enrollmentNo:   found.enrollmentNo   || found.rollNumber   || '',
          dateOfBirth:    found.dob            || found.dateOfBirth  || '',
          contactNo:      found.contactNo      || found.mobileNo     || found.phone || '',
          address:        found.address        || '',
          mobileNo:       found.mobileNo       || found.phone        || '',
          centerMobileNo: found.centerMobileNo || '',
          photo:          found.photo          || ''
        };
        console.warn('No student found:', idCardOrRoll);
        return { enrollmentNo: idCardOrRoll };
      }
      return { enrollmentNo: idCardOrRoll };
    }
    return idCardOrRoll || {};
  }

  function _loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image: ' + src));
      img.src = src;
    });
  }

  async function _render(idCard) {
    const data = _resolveIDCardData(idCard);
    if (!_templateImg) throw new Error('Template not loaded. Call IDCardGenerator.loadTemplate() first.');
    if (!_initCanvas()) throw new Error('Canvas not found.');

    _canvas.width  = _templateImg.naturalWidth;
    _canvas.height = _templateImg.naturalHeight;
    _ctx.imageSmoothingEnabled = true;
    _ctx.imageSmoothingQuality = 'high';
    _ctx.drawImage(_templateImg, 0, 0);

    if (data.photo) {
      try {
        const photoImg = await _loadImage(data.photo);
        if (photoImg) {
          const pf = CONFIG.fields.photo;
          const cx = _pct(pf.x, _canvas.width);
          const cy = _pct(pf.y, _canvas.height);
          const cw = _pct(pf.width,  _canvas.width);
          const ch = _pct(pf.height, _canvas.height);
          // Draw photo clipped to circle
          const tmp    = document.createElement('canvas');
          const tmpCtx = tmp.getContext('2d');
          tmp.width  = cw;
          tmp.height = ch;
          tmpCtx.beginPath();
          tmpCtx.arc(cw / 2, ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2);
          tmpCtx.fillStyle = '#000000';
          tmpCtx.fill();
          tmpCtx.globalCompositeOperation = 'source-in';
          tmpCtx.drawImage(photoImg, 0, 0, cw, ch);
          _ctx.drawImage(tmp, cx, cy, cw, ch);
        }
      } catch (e) { console.warn('Could not load student photo:', e); }
    }

    _drawField(CONFIG.fields.studentName,    data.studentName);
    _drawField(CONFIG.fields.sessionFrom,    data.sessionFrom);
    _drawField(CONFIG.fields.sessionTo,      data.sessionTo);
    _drawField(CONFIG.fields.fatherName,     data.fatherName);
    _drawField(CONFIG.fields.motherName,     data.motherName);
    _drawField(CONFIG.fields.enrollmentNo,   data.enrollmentNo);
    _drawField(CONFIG.fields.dateOfBirth,    _fmtDate(data.dateOfBirth));
    _drawField(CONFIG.fields.contactNo,      data.contactNo);
    _drawWrappedText(CONFIG.fields.address,  data.address);
    _drawField(CONFIG.fields.mobileNo,       data.mobileNo);
    _drawField(CONFIG.fields.centerMobileNo, data.centerMobileNo);
  }

  // ── PDF generation ────────────────────────────────────────────────────────
  //
  // TARGET: ~2 MB PDF
  //
  // The ID card template is 2125×3375px — much smaller than the certificate.
  // At native resolution, browser toDataURL(0.92) produces only ~0.6 MB.
  //
  // Fix: upsample the canvas 2× to 4250×6750 before encoding.
  // Browser toDataURL(0.92) ≈ PIL q=90 on this image.
  // At 2× upscale + quality 0.92 → ~2.0 MB, matching the target.
  //
  // 'NONE' passed to jsPDF.addImage prevents a second lossy compression pass.
  //
  // -- PDF generation --------------------------------------------------
  //
  // TARGET: ~2 MB
  //
  // The template is 2125x3375 (aspect 0.6296), NOT the same as A4 (0.7071).
  // Forcing A4 was squishing the image vertically because the PDF page is
  // wider relative to its height than the card template.
  //
  // Fix: use a CUSTOM page size of 210 x 333.5mm derived from the template's
  // own pixel ratio: PAGE_H = 210 * (3375/2125) = 333.5mm.
  // The image then fills the page exactly with no distortion.
  //
  // 2x upsample keeps file size at ~2 MB. 'NONE' stops jsPDF re-compressing.
  //
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;

    const W = _canvas.width, H = _canvas.height;

    // Custom page dimensions that exactly match the template aspect ratio.
    // 210mm wide is standard; height is derived from the template pixel ratio.
    const PAGE_W_MM = 210;
    const PAGE_H_MM = Math.round((PAGE_W_MM * H / W) * 10) / 10;

    // Upsample 2x so the encoded JPEG hits ~2 MB at quality 0.92
    const SCALE = 2;
    const off   = document.createElement('canvas');
    off.width   = W * SCALE;
    off.height  = H * SCALE;
    const octx  = off.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(_canvas, 0, 0, off.width, off.height);

    const imgData = off.toDataURL('image/jpeg', 0.92);
    console.log('ID card PDF encoded ~',
      Math.round(imgData.length * 0.75 / 1024 / 1024 * 10) / 10, 'MB',
      '| page:', PAGE_W_MM, 'x', PAGE_H_MM, 'mm');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      [PAGE_W_MM, PAGE_H_MM],
    });

    // 'NONE' = embed pre-encoded JPEG as-is, no second compression pass
    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W_MM, PAGE_H_MM, '', 'NONE');
    return pdf;
  }

  function _safeName(name) {
    if (!name) return 'id-card';
    return name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.IDCardGenerator = {

    async loadTemplate(path) {
      _initCanvas();
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => { _templateImg = img; console.log('ID card template loaded:', img.width, 'x', img.height); resolve(img); };
        img.onerror = (e) => { console.error('Load failed:', e); reject(new Error('Failed to load: ' + (path || CONFIG.templatePath))); };
        img.src = path || CONFIG.templatePath;
      });
    },

    async download(idCardOrRoll) {
      try {
        await _render(idCardOrRoll);
        const pdf  = _canvasToPDF();
        const data = _resolveIDCardData(idCardOrRoll);
        pdf.save(`id-card_${_safeName(data.enrollmentNo || data.studentName)}.pdf`);
      } catch (err) {
        console.error('IDCardGenerator.download error:', err);
        alert('Failed to generate PDF: ' + err.message);
      }
    },

    async preview(idCardOrRoll) {
      await _render(idCardOrRoll);
      return new Promise((resolve, reject) => {
        _canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('toBlob returned null')),
          'image/jpeg', 0.85
        );
      });
    },

    async downloadAll(idCards, delayMs = 500) {
      if (!Array.isArray(idCards) || idCards.length === 0) {
        console.warn('No ID cards to download'); return;
      }
      for (let i = 0; i < idCards.length; i++) {
        try {
          await _render(idCards[i]);
          const pdf  = _canvasToPDF();
          const data = _resolveIDCardData(idCards[i]);
          pdf.save(`id-card_${_safeName(data.enrollmentNo || data.studentName || i)}.pdf`);
          if (i < idCards.length - 1) await new Promise(r => setTimeout(r, delayMs));
        } catch (err) { console.error(`Error generating ID card ${i}:`, err); }
      }
    },

    updateConfig(newConfig) {
      if (newConfig?.fields)       Object.assign(CONFIG.fields, newConfig.fields);
      if (newConfig?.templatePath) CONFIG.templatePath = newConfig.templatePath;
    },

    getConfig() { return JSON.parse(JSON.stringify(CONFIG)); }
  };

})();