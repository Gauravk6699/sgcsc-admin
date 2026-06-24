// ╔══════════════════════════════════════════════════════════════════════════╗
// ║              CERTIFICATE GENERATOR  v2 — DROP-IN MODULE                ║
// ║                                                                          ║
// ║  Key design decisions:                                                   ║
// ║  • ONE render path (_render) used by preview, download and DB image.     ║
// ║  • centerName === atcName — they are the same field on the template.     ║
// ║  • PDF is produced by rendering canvas at native resolution then         ║
// ║    embedding as JPEG into A4 — no second compression pass.               ║
// ║  • Preview dataURL is generated from the SAME canvas render so what      ║
// ║    you see in the modal is pixel-identical to what you download.         ║
// ╚══════════════════════════════════════════════════════════════════════════╝

var CertificateGenerator = (() => {

  // ── Configuration ──────────────────────────────────────────────────────────
  let VERIFY_BASE_URL = 'https://sgcsc.in';

  const CONFIG = {
    templatePath: 'student-certificate-template.jpeg',
    fields: {
      photo:               { x: 41.5, y: 30.7, width: 16,    height: 13    },
      // centerName is the ONE "ATC-:" row on the template (y:52.7).
      // atcName is NOT a separate visual field — it is only an alias in the data layer.
      // Drawing it would print the org name a second time over the course-name row.
      centerName:          { x: 18,   y: 52.7, font: '160px serif', color: '#000000', align: 'left',   maxWidth: 70 },
      studentNameCombined: { x: 50,   y: 49,   font: '160px serif', color: '#000000', align: 'center', maxWidth: 80 },
      courseName:          { x: 50,   y: 58.5, font: '160px serif', color: '#000000', align: 'center', maxWidth: 70 },
      grade:               { x: 56.5, y: 55.5, font: '160px serif', color: '#000000', align: 'left'   },
      gradeExtra:          { x: 80,   y: 76.3, font: '160px serif', color: '#000000', align: 'left'   },
      courseDuration:      { x: 54,   y: 61.5, font: '160px serif', color: '#000000', align: 'left',   maxWidth: 40 },
      coursePeriodFrom:    { x: 41.5, y: 64.3, font: '156px serif', color: '#000000', align: 'left'   },
      coursePeriodTo:      { x: 61,   y: 64.3, font: '156px serif', color: '#000000', align: 'left'   },
      certificateNumber:   { x: 23,   y: 93,   font: '100px serif', color: '#000000', align: 'left'   },
      dateOfIssue:         { x: 55,   y: 93,   font: '100px serif', color: '#000000', align: 'left'   },
      qrCode:              { x: 19.7, y: 85.8, width: 12.5,  height: 11.5  }
    }
  };

  // ── Private state ──────────────────────────────────────────────────────────
  let _templateImg = null;
  let _canvas      = null;
  let _ctx         = null;

  // ── Internal helpers ───────────────────────────────────────────────────────

  function _initCanvas() {
    if (!_canvas) {
      _canvas = document.getElementById('certCanvas');
      if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.id = 'certCanvas';
        _canvas.style.display = 'none';
        _canvas.width  = 800;
        _canvas.height = 600;
        document.body.appendChild(_canvas);
      }
    }
    if (_canvas && !_ctx) _ctx = _canvas.getContext('2d');
    return !!(_canvas && _ctx);
  }

  function _fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _pct(val, total) { return (val / 100) * total; }

  // Load an image with crossOrigin=anonymous (required for toDataURL without canvas taint).
  // If the server does not send CORS headers the load will fail — resolve(null) so the
  // canvas stays untainted and all text fields / QR still render correctly.
  function _loadImage(src, timeout = 10000) {
    return new Promise((resolve) => {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => { img.src = ''; resolve(null); }, timeout);
      img.onload  = () => { clearTimeout(timer); resolve(img); };
      // onerror fires when the server lacks CORS headers — resolve null, never reject,
      // so the canvas is never tainted and toDataURL() works for all subsequent draws.
      img.onerror = () => {
        clearTimeout(timer);
        console.warn('[CertGen] Photo skipped (CORS/load error):', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  function _drawQRCode(certificateNumber) {
    if (!certificateNumber || !_ctx) return;
    const qrField = CONFIG.fields.qrCode;
    if (!qrField) return;

    const verifyUrl = `${VERIFY_BASE_URL}/verify/${encodeURIComponent(certificateNumber)}`;
    const W = _canvas.width, H = _canvas.height;
    const size = Math.min(_pct(qrField.width, W), _pct(qrField.height, H));
    const x    = _pct(qrField.x, W) - size / 2;
    const y    = _pct(qrField.y, H) - size / 2;

    try {
      if (typeof QRious === 'undefined') throw new Error('QRious not loaded');
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width  = size;
      qrCanvas.height = size;
      const qrCtx = qrCanvas.getContext('2d');
      qrCtx.fillStyle = 'white';
      qrCtx.fillRect(0, 0, size, size);
      new QRious({
        element: qrCanvas,
        value: verifyUrl,
        size: size,
        background: 'white',
        foreground: 'black'
      });
      _ctx.save();
      _ctx.fillStyle = 'white';
      _ctx.fillRect(x, y, size, size);
      _ctx.globalCompositeOperation = 'source-over';
      _ctx.drawImage(qrCanvas, x, y, size, size);
      _ctx.restore();
      console.log('[CertGen] QR drawn at', x.toFixed(0), y.toFixed(0), size.toFixed(0), 'for', verifyUrl);
    } catch (e) {
      console.warn('[CertGen] QR fallback:', e.message);
      _ctx.save();
      _ctx.fillStyle = 'white';
      _ctx.fillRect(x, y, size, size);
      _ctx.strokeStyle = '#000'; _ctx.lineWidth = 2;
      _ctx.strokeRect(x, y, size, size);
      _ctx.fillStyle = '#000'; _ctx.font = '16px serif'; _ctx.textAlign = 'center';
      _ctx.fillText('QR', x + size / 2, y + size / 2 + 5);
      _ctx.restore();
    }
  }

  // Shrinks `font` so `text` measures within maxWidthPx — the actual typeface a
  // browser substitutes for a generic family like "serif" varies across
  // devices/OSes and can render wider than expected.
  const MIN_FONT_PX = 50;
  function _fitFont(text, font, maxWidthPx, minFontPx) {
    const match = /^(\d+(?:\.\d+)?)px(.*)$/.exec(font);
    if (!match) return font;
    const baseSize = parseFloat(match[1]);
    const rest = match[2];
    _ctx.font = font;
    const width = _ctx.measureText(text).width;
    if (width <= maxWidthPx || width === 0) return font;
    const fitSize = Math.max(minFontPx, Math.floor(baseSize * (maxWidthPx / width)));
    return `${fitSize}px${rest}`;
  }

  function _drawField(field, text) {
    if (!text || !_ctx) return;
    const W = _canvas.width, H = _canvas.height;
    _ctx.save();
    let font = field.font;
    const x = _pct(field.x, W);
    const y = _pct(field.y, H);
    const align = field.align || 'left';
    let maxWidthPx = null;
    let boxX = x;
    if (field.maxWidth) {
      maxWidthPx = _pct(field.maxWidth, W);
      font = _fitFont(text, field.font, maxWidthPx, field.minFont || MIN_FONT_PX);
      if (align === 'center') boxX = x - maxWidthPx / 2;
      else if (align === 'right') boxX = x - maxWidthPx;
    }
    _ctx.font        = font;
    _ctx.fillStyle   = field.color;
    _ctx.textAlign   = align;
    if (maxWidthPx) {
      // Hard backstop: even if the font-shrink estimate is off, no pixel can
      // render past the field's box once this clip is applied.
      const fontPx = parseFloat(font) || 0;
      _ctx.beginPath();
      _ctx.rect(boxX, y - fontPx * 0.85, maxWidthPx, fontPx * 1.2);
      _ctx.clip();
    }
    _ctx.fillText(text, x, y);
    _ctx.restore();
  }

  function _drawPhoto(img) {
    if (!img || !_ctx) return;
    const pf = CONFIG.fields.photo; if (!pf) return;
    const W = _canvas.width, H = _canvas.height;
    _ctx.save();
    _ctx.beginPath();
    _ctx.rect(_pct(pf.x, W), _pct(pf.y, H), _pct(pf.width, W), _pct(pf.height, H));
    _ctx.clip();
    _ctx.drawImage(img, _pct(pf.x, W), _pct(pf.y, H), _pct(pf.width, W), _pct(pf.height, H));
    _ctx.restore();
  }

  // ── Core render — SINGLE path used by all public methods ──────────────────
  //
  // All public methods (preview, download, getDataURL, DB image save) call
  // _render(), then read from _canvas.  This guarantees that what you see in
  // the modal is byte-identical to what lands in the PDF.
  //
  async function _render(studentOrRoll) {
    const student = _resolveStudentData(studentOrRoll);
    if (!_initCanvas()) throw new Error('Canvas not initialised.');
    if (!_templateImg || !_templateImg.complete || _templateImg.naturalWidth === 0) {
      throw new Error('Template not loaded. Call loadTemplate() first.');
    }

    // Size canvas to template's native pixel dimensions
    _canvas.width  = _templateImg.naturalWidth;
    _canvas.height = _templateImg.naturalHeight;
    console.log('[CertGen] Canvas:', _canvas.width, 'x', _canvas.height);

    _ctx.imageSmoothingEnabled = true;
    _ctx.imageSmoothingQuality = 'high';

    // 1. Draw template background
    _ctx.drawImage(_templateImg, 0, 0);

    // 2. Student photo
    // _loadImage always resolves (never rejects) so a missing CORS header on the
    // photo URL cannot taint the canvas or interrupt the rest of the render.
    if (student.photo) {
      const photoImg = await _loadImage(student.photo, 10000);
      if (photoImg) {
        try {
          _drawPhoto(photoImg);
          // Probe for taint immediately — if toDataURL throws here the photo
          // is cross-origin without CORS headers; redraw template to clear it.
          _canvas.toDataURL('image/jpeg', 0.1);
        } catch (secErr) {
          console.warn('[CertGen] Canvas tainted by photo, re-drawing template without photo.');
          _canvas.width  = _templateImg.naturalWidth;
          _canvas.height = _templateImg.naturalHeight;
          _ctx.imageSmoothingEnabled = true;
          _ctx.imageSmoothingQuality = 'high';
          _ctx.drawImage(_templateImg, 0, 0);
        }
      }
    }

    // 3. QR code
    _drawQRCode(student.certificateNumber);

    // 4. Text fields
    // centerName / atcName are the same field on the template (the "ATC-:" row at y:52.7).
    // Draw it ONCE only — the atcName config entry exists for legacy position-tweaking
    // but must NOT be drawn separately or it prints the org name a second time over
    // the course-name area (y:60).
    const orgName = student.centerName || student.atcName || '';
    _drawField(CONFIG.fields.centerName, orgName);
    // ← atcName intentionally NOT drawn here

    _drawField(CONFIG.fields.studentNameCombined, student.studentNameCombined);
    _drawField(CONFIG.fields.courseName,          student.courseName);
    _drawField(CONFIG.fields.grade,               student.grade);
    _drawField(CONFIG.fields.gradeExtra,          student.grade);
    _drawField(CONFIG.fields.courseDuration,      (student.courseDuration || '').toUpperCase());
    _drawField(CONFIG.fields.coursePeriodFrom,    student.coursePeriodFrom ? _fmtDate(student.coursePeriodFrom) : '');
    _drawField(CONFIG.fields.coursePeriodTo,      student.coursePeriodTo   ? _fmtDate(student.coursePeriodTo)   : '');
    _drawField(CONFIG.fields.certificateNumber,   student.certificateNumber);
    _drawField(CONFIG.fields.dateOfIssue,         _fmtDate(student.dateOfIssue));

    return _canvas;
  }

  // ── PDF builder ────────────────────────────────────────────────────────────
  //
  // Reads _canvas as-is (already rendered by _render).
  // JPEG quality 0.92 → ~2.5 MB at native 5662×8000 px.
  // compression:'NONE' stops jsPDF from applying a second lossy pass.
  //
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;
    const imgData = _canvas.toDataURL('image/jpeg', 0.92);
    console.log('[CertGen] PDF ~', Math.round(imgData.length * 0.75 / 1024 / 1024 * 10) / 10, 'MB');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, '', 'NONE');
    return pdf;
  }

  function _safeName(n) { return (n || 'certificate').replace(/[^a-z0-9_\-]/gi, '_'); }

  // ── Student data resolver ──────────────────────────────────────────────────
  //
  // Normalises whatever shape comes in (string roll number, raw DB record, or
  // an already-shaped object) into the flat struct _render() expects.
  //
  function _resolveStudentData(s) {
    if (typeof s === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const f = window.StudentDB.find(s);
        if (f) s = f;
        else return { studentNameCombined: s };
      } else {
        return { studentNameCombined: s };
      }
    }
    if (!s) return {};

    // Merge centerName / atcName — treat them as one field
    const orgName = s.centerName || s.atcName || '';

    return {
      centerName:          orgName,
      atcName:             orgName,
      studentNameCombined: s.studentNameCombined || s.studentName || s.applicantName || '',
      courseName:          s.courseName          || '',
      grade:               s.grade               || '',
      courseDuration:      s.courseDuration       || '',
      coursePeriodFrom:    s.coursePeriodFrom     || '',
      coursePeriodTo:      s.coursePeriodTo       || '',
      certificateNumber:   s.certificateNumber    || '',
      dateOfIssue:         s.dateOfIssue          || '',
      photo:               s.photo                || ''
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {

    // Load template from URL / path
    async loadTemplate(pathOrDataURL, timeout = 8000) {
      _initCanvas();
      const src = pathOrDataURL || CONFIG.templatePath;
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => { img.src = ''; _templateImg = null; resolve(null); }, timeout);
        img.onload  = () => { clearTimeout(timer); _templateImg = img; console.log('[CertGen] Template:', img.naturalWidth, 'x', img.naturalHeight); resolve(img); };
        img.onerror = () => { clearTimeout(timer); _templateImg = null; console.warn('[CertGen] Template load failed:', src); resolve(null); };
        img.src = src;
      });
    },

    // Load template from a <input type="file"> File/Blob
    async loadTemplateFromFile(file, timeout = 8000) {
      _initCanvas();
      if (!(file instanceof Blob)) throw new Error('loadTemplateFromFile expects a File or Blob');
      const objectURL = URL.createObjectURL(file);
      return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => { img.src = ''; _templateImg = null; resolve(null); }, timeout);
        img.onload  = () => { clearTimeout(timer); _templateImg = img; URL.revokeObjectURL(objectURL); resolve(img); };
        img.onerror = () => { clearTimeout(timer); _templateImg = null; URL.revokeObjectURL(objectURL); resolve(null); };
        img.src = objectURL;
      });
    },

    // ── Preview / data-URL helpers ─────────────────────────────────────────
    //
    // All three methods call _render first so the result always matches the PDF.

    /** Returns a JPEG dataURL suitable for <img src=…> preview.
     *  q=0.85 gives good visual quality without being as heavy as the PDF encode. */
    async preview(s) {
      await _render(s);
      return _canvas.toDataURL('image/jpeg', 0.85);
    },

    /** Alias kept for back-compat */
    async getPreviewURL(s) { return this.preview(s); },

    /** Returns a JPEG dataURL at the requested quality (default 0.85). */
    async getDataURL(s, q = 0.85) {
      await _render(s);
      return _canvas.toDataURL('image/jpeg', q);
    },

    /** Returns a compressed dataURL (0.4 quality) for lightweight DB storage. */
    async getCompressedDataURL(s) { return this.getDataURL(s, 0.4); },

    /** Returns a full-res JPEG dataURL (0.95) for the modal image preview.
     *  The image shown in the modal is generated fresh — not the stale DB copy —
     *  so it is guaranteed to match the downloaded PDF. */
    async getImageDataURL(s) {
      await _render(s);
      // Optionally downsample for display to keep it snappy
      const W = _canvas.width, H = _canvas.height;
      const MAX = 2000;
      if (W <= MAX && H <= MAX) return _canvas.toDataURL('image/jpeg', 0.95);
      const ratio = Math.min(MAX / W, MAX / H);
      const off = document.createElement('canvas');
      off.width  = Math.round(W * ratio);
      off.height = Math.round(H * ratio);
      const octx = off.getContext('2d');
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(_canvas, 0, 0, off.width, off.height);
      return off.toDataURL('image/jpeg', 0.95);
    },

    // ── Download ───────────────────────────────────────────────────────────
    async download(studentOrRoll) {
      await _render(studentOrRoll);
      const student = _resolveStudentData(studentOrRoll);
      _canvasToPDF().save(`certificate_${_safeName(student.studentNameCombined)}.pdf`);
    },

    async getPDFDataURL(studentOrRoll) {
      await _render(studentOrRoll);
      return _canvasToPDF().output('datauristring');
    },

    async downloadAll(students, onProgress) {
      if (!Array.isArray(students) || !students.length) return;
      for (let i = 0; i < students.length; i++) {
        await this.download(students[i]);
        if (onProgress) onProgress(i + 1, students.length);
        await new Promise(r => setTimeout(r, 350));
      }
    },

    // ── Config helpers ─────────────────────────────────────────────────────
    setVerifyBaseUrl(url)          { if (url) VERIFY_BASE_URL = url; },
    setField(name, overrides)      { if (!CONFIG.fields[name]) throw new Error('Unknown field: ' + name); Object.assign(CONFIG.fields[name], overrides); },
    updateFieldPositions(f)        { if (f) Object.assign(CONFIG.fields, f); },
    updateConfig(c)                { if (c?.fields) this.updateFieldPositions(c.fields); },

    async fetchConfigFromAPI() {
      console.log('[CertGen] Using built-in field positions.');
      return false;
    },

    get config() { return CONFIG; }
  };
})();

window.CertificateGenerator = CertificateGenerator;