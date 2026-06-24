// ╔══════════════════════════════════════════════════════════════════════════╗
// ║           TYPING CERTIFICATE GENERATOR — DROP-IN MODULE                 ║
// ║                                                                          ║
// ║  Same design as CertificateGenerator v2:                                 ║
// ║  • ONE render path (_render) used by preview, download and DB image.     ║
// ║  • Photo drawn with CORS-safe loader (resolves null on failure).         ║
// ║  • QR code links to /verify/typing/<certificateNo> for scan verification.║
// ║  • PDF produced by rendering canvas at native resolution.                ║
// ╚══════════════════════════════════════════════════════════════════════════╝

var TypingCertificateGenerator = (() => {

  // ── Configuration ──────────────────────────────────────────────────────────
  let VERIFY_BASE_URL = 'https://sgcsc.in';

  const CONFIG = {
    templatePath: 'typing-certificate-template.jpeg',
    fields: {
      // Photo box — upper-right box on the template (x/y = top-left corner, as % of image)
      photo:              { x: 81.7, y: 35,   width: 12,  height: 19   },
      // QR code — center of upper-left box on the template (x/y = center, as % of image)
      qrCode:             { x: 12.5, y: 45,   width: 12,  height: 45   },
      // Text fields — positions as % of image width/height
      studentName:        { x: 63,   y: 52.3, font: '200px serif', color: '#000000', align: 'center', maxWidth: 44 },
      fatherHusbandName:  { x: 32,   y: 57,   font: '200px serif', color: '#000000', align: 'left',   maxWidth: 68 },
      motherName:         { x: 70,   y: 57,   font: '200px serif', color: '#000000', align: 'left',   maxWidth: 95 },
      enrollmentNumber:   { x: 22.5, y: 77.5, font: '150px serif', color: '#000000', align: 'left'   },
      computerTyping:     { x: 22.5, y: 82,   font: '150px serif', color: '#000000', align: 'left'   },
      certificateNo:      { x: 22.5, y: 86.2, font: '150px serif', color: '#000000', align: 'left'   },
      dateOfIssue:        { x: 22.5, y: 90.7, font: '150px serif', color: '#000000', align: 'left'   },
      sessionFrom:        { x: 74,   y: 61,   font: '200px serif', color: '#000000', align: 'left'   },
      sessionTo:          { x: 83,   y: 61,   font: '200px serif', color: '#000000', align: 'left'   },
      grade:              { x: 86,   y: 65,   font: '200px serif', color: '#000000', align: 'left'   },
      studyCentre:        { x: 37,   y: 69.4, font: '200px serif', color: '#000000', align: 'left',   maxWidth: 95 },
      wordsPerMinute:     { x: 28.5, y: 82,   font: '150px serif', color: '#000000', align: 'left'   },
    }
  };

  // ── Private state ──────────────────────────────────────────────────────────
  let _templateImg = null;
  let _canvas      = null;
  let _ctx         = null;

  // ── Internal helpers ───────────────────────────────────────────────────────

  function _initCanvas() {
    if (!_canvas) {
      _canvas = document.getElementById('typingCertCanvas');
      if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.id = 'typingCertCanvas';
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

  // CORS-safe image loader — resolves null on error so the canvas is never tainted.
  function _loadImage(src, timeout = 10000) {
    return new Promise((resolve) => {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => { img.src = ''; resolve(null); }, timeout);
      img.onload  = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => {
        clearTimeout(timer);
        console.warn('[TypingCertGen] Photo skipped (CORS/load error):', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  function _drawQRCode(certificateNo) {
    if (!certificateNo || !_ctx) return;
    const qrField = CONFIG.fields.qrCode;
    if (!qrField) return;

    const verifyUrl = `${VERIFY_BASE_URL}/verify/typing/${encodeURIComponent(certificateNo)}`;
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
      console.log('[TypingCertGen] QR drawn at', x.toFixed(0), y.toFixed(0), size.toFixed(0), 'for', verifyUrl);
    } catch (e) {
      console.warn('[TypingCertGen] QR fallback:', e.message);
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
  const MIN_FONT_PX = 60;
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
      if (align === 'center') {
        maxWidthPx = _pct(field.maxWidth, W);
        boxX = x - maxWidthPx / 2;
      } else if (align === 'right') {
        maxWidthPx = x;
        boxX = 0;
      } else {
        maxWidthPx = _pct(field.maxWidth, W) - x;
      }
      font = _fitFont(text, field.font, maxWidthPx, field.minFont || MIN_FONT_PX);
    }
    _ctx.font      = font;
    _ctx.fillStyle = field.color;
    _ctx.textAlign = align;
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

  function _resolveTypingData(dataOrId) {
    if (typeof dataOrId === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const found = window.StudentDB.find(dataOrId);
        if (found) dataOrId = found;
        else return { studentName: dataOrId };
      } else {
        return { studentName: dataOrId };
      }
    }
    const s = dataOrId || {};
    return {
      studentName:       s.studentName       || s.applicantName || s.name || '',
      fatherHusbandName: s.fatherHusbandName || s.fatherName    || '',
      motherName:        s.motherName        || '',
      enrollmentNumber:  s.enrollmentNumber  || s.enrollmentNo  || s.rollNumber || '',
      computerTyping:    s.computerTyping    || '',
      certificateNo:     s.certificateNo     || s.certificateNumber || '',
      dateOfIssue:       s.dateOfIssue       || '',
      sessionFrom:       s.sessionFrom       || '',
      sessionTo:         s.sessionTo         || '',
      grade:             s.grade             || '',
      studyCentre:       s.studyCentre       || '',
      wordsPerMinute:    s.wordsPerMinute    || '',
      photo:             s.photo             || '',
    };
  }

  // ── Core render — SINGLE path used by all public methods ──────────────────
  async function _render(dataOrId) {
    const student = _resolveTypingData(dataOrId);
    if (!_initCanvas()) throw new Error('Canvas not initialised.');
    if (!_templateImg || !_templateImg.complete || _templateImg.naturalWidth === 0) {
      throw new Error('Template not loaded. Call loadTemplate() first.');
    }

    _canvas.width  = _templateImg.naturalWidth;
    _canvas.height = _templateImg.naturalHeight;
    console.log('[TypingCertGen] Canvas:', _canvas.width, 'x', _canvas.height);

    _ctx.imageSmoothingEnabled = true;
    _ctx.imageSmoothingQuality = 'high';

    // 1. Draw template background
    _ctx.drawImage(_templateImg, 0, 0);

    // 2. Student photo (CORS-safe — never taints the canvas)
    if (student.photo) {
      const photoImg = await _loadImage(student.photo, 10000);
      if (photoImg) {
        try {
          _drawPhoto(photoImg);
          _canvas.toDataURL('image/jpeg', 0.1); // taint probe
        } catch (secErr) {
          console.warn('[TypingCertGen] Canvas tainted by photo, re-drawing template without photo.');
          _canvas.width  = _templateImg.naturalWidth;
          _canvas.height = _templateImg.naturalHeight;
          _ctx.imageSmoothingEnabled = true;
          _ctx.imageSmoothingQuality = 'high';
          _ctx.drawImage(_templateImg, 0, 0);
        }
      }
    }

    // 3. QR code
    _drawQRCode(student.certificateNo);

    // 4. Text fields
    _drawField(CONFIG.fields.studentName,       student.studentName);
    _drawField(CONFIG.fields.fatherHusbandName, student.fatherHusbandName);
    _drawField(CONFIG.fields.motherName,        student.motherName);
    _drawField(CONFIG.fields.enrollmentNumber,  student.enrollmentNumber);
    _drawField(CONFIG.fields.computerTyping,    student.computerTyping);
    _drawField(CONFIG.fields.certificateNo,     student.certificateNo);
    _drawField(CONFIG.fields.dateOfIssue,       _fmtDate(student.dateOfIssue));
    _drawField(CONFIG.fields.sessionFrom,       student.sessionFrom);
    _drawField(CONFIG.fields.sessionTo,         student.sessionTo);
    _drawField(CONFIG.fields.grade,             student.grade);
    _drawField(CONFIG.fields.studyCentre,       student.studyCentre);
    _drawField(CONFIG.fields.wordsPerMinute,    student.wordsPerMinute);

    return _canvas;
  }

  // ── PDF builder ────────────────────────────────────────────────────────────
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;
    const imgData = _canvas.toDataURL('image/jpeg', 0.92);
    console.log('[TypingCertGen] PDF ~', Math.round(imgData.length * 0.75 / 1024 / 1024 * 10) / 10, 'MB');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, '', 'NONE');
    return pdf;
  }

  function _safeName(n) { return (n || 'certificate').replace(/[^a-z0-9_\-]/gi, '_'); }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {

    // Load template from URL / path
    async loadTemplate(pathOrDataURL, customConfig = null) {
      _initCanvas();
      if (customConfig && customConfig.fields) {
        Object.assign(CONFIG.fields, customConfig.fields);
      }
      const src = pathOrDataURL || CONFIG.templatePath;
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => { img.src = ''; _templateImg = null; resolve(null); }, 8000);
        img.onload  = () => { clearTimeout(timer); _templateImg = img; console.log('[TypingCertGen] Template:', img.naturalWidth, 'x', img.naturalHeight); resolve(img); };
        img.onerror = () => { clearTimeout(timer); _templateImg = null; console.warn('[TypingCertGen] Template load failed:', src); resolve(null); };
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

    async preview(s) {
      await _render(s);
      return _canvas.toDataURL('image/jpeg', 0.85);
    },

    async getPreviewURL(s) { return this.preview(s); },

    async getDataURL(s, q = 0.95) {
      await _render(s);
      return _canvas.toDataURL('image/jpeg', q);
    },

    async getCompressedDataURL(s) { return this.getDataURL(s, 0.4); },

    async getImageDataURL(s) {
      await _render(s);
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
    async download(dataOrId) {
      await _render(dataOrId);
      const student = _resolveTypingData(dataOrId);
      _canvasToPDF().save(`typing_certificate_${_safeName(student.studentName)}.pdf`);
    },

    async getPDFDataURL(dataOrId) {
      await _render(dataOrId);
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
    setVerifyBaseUrl(url)      { if (url) VERIFY_BASE_URL = url; },
    setField(name, overrides)  { if (!CONFIG.fields[name]) throw new Error('Unknown field: ' + name); Object.assign(CONFIG.fields[name], overrides); },
    updateFieldPositions(f)    { if (f) Object.assign(CONFIG.fields, f); },
    updateConfig(c)            { if (c?.fields) this.updateFieldPositions(c.fields); },

    async fetchConfigFromAPI() {
      console.log('[TypingCertGen] Using built-in field positions.');
      return false;
    },

    get config() { return CONFIG; }
  };

})();

window.TypingCertificateGenerator = TypingCertificateGenerator;
