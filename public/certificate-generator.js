// ╔══════════════════════════════════════════════════════════════╗
// ║           CERTIFICATE GENERATOR — DROP-IN MODULE            ║
// ╚══════════════════════════════════════════════════════════════╝

var CertificateGenerator = (() => {

  const VERIFY_BASE_URL = 'https://www.sgcsc.in/verify';

  const CONFIG = {
    templatePath: 'student-certificate-template.jpeg',
    fields: {
      photo:                { x: 41.5, y: 30.7, width: 16,   height: 13   },
      centerName:           { x: 18,   y: 52.7, font: '160px serif', color: '#000000', align: 'left'   },
      studentNameCombined:  { x: 50,   y: 49,   font: '160px serif', color: '#000000', align: 'center' },
      courseName:           { x: 50,   y: 58.5, font: '160px serif', color: '#000000', align: 'center' },
      grade:                { x: 56.5, y: 55.5, font: '160px serif', color: '#000000', align: 'left'   },
      gradeExtra:           { x: 80,   y: 76.3, font: '160px serif', color: '#000000', align: 'left'   },
      courseDuration:       { x: 54,   y: 61.5, font: '160px serif', color: '#000000', align: 'left'   },
      coursePeriodFrom:     { x: 41.5, y: 64.3, font: '160px serif', color: '#000000', align: 'left'   },
      coursePeriodTo:       { x: 61,   y: 64.3, font: '160px serif', color: '#000000', align: 'left'   },
      certificateNumber:    { x: 23,   y: 93,   font: '160px serif', color: '#000000', align: 'left'   },
      dateOfIssue:          { x: 55,   y: 93,   font: '160px serif', color: '#000000', align: 'left'   },
      qrCode:               { x: 19.7, y: 85.8, width: 12.5, height: 11.5 }
    }
  };

  let _templateImg = null;
  let _canvas      = null;
  let _ctx         = null;

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
      if (_canvas && !_ctx) _ctx = _canvas.getContext('2d');
    }
    return _canvas && _ctx;
  }

  function _fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _pct(val, total) { return (val / 100) * total; }

  function _loadImage(src, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => { img.src = ''; reject(new Error(`Timeout: ${src}`)); }, timeout);
      img.onload  = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => { clearTimeout(timer); reject(new Error('Failed: ' + src)); };
      img.src = src;
    });
  }

  function _drawQRCode(certificateNumber) {
    if (!certificateNumber || !_ctx) return;
    const qrField = CONFIG.fields.qrCode;
    if (!qrField) return;

    const verifyUrl = `${VERIFY_BASE_URL}/${encodeURIComponent(certificateNumber)}`;
    const W = _canvas.width, H = _canvas.height;
    const size = Math.min(_pct(qrField.width, W), _pct(qrField.height, H));
    const x    = _pct(qrField.x, W) - size / 2;
    const y    = _pct(qrField.y, H) - size / 2;

    try {
      if (typeof QRious === 'undefined') throw new Error('QRious not loaded');
      const qr = new QRious({ value: verifyUrl, size: size, background: 'white', foreground: 'black' });
      // Draw QR via offscreen canvas to avoid HTMLImageElement load timing issue
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width  = size;
      qrCanvas.height = size;
      const qrCtx = qrCanvas.getContext('2d');
      // QRious draws directly to a canvas if you pass it
      const qrDirect = new QRious({ element: qrCanvas, value: verifyUrl, size: size, background: 'white', foreground: 'black' });
      _ctx.drawImage(qrCanvas, x, y, size, size);
      console.log('QR drawn at', x, y, size, 'for', verifyUrl);
    } catch (e) {
      console.warn('QR failed:', e.message);
      _ctx.save();
      _ctx.strokeStyle = '#000'; _ctx.lineWidth = 2;
      _ctx.strokeRect(x, y, size, size);
      _ctx.fillStyle = '#000'; _ctx.font = '16px serif'; _ctx.textAlign = 'center';
      _ctx.fillText('QR', x + size/2, y + size/2 + 5);
      _ctx.restore();
    }
  }

  function _drawField(field, text) {
    if (!text || !_ctx) return;
    const W = _canvas.width, H = _canvas.height;
    _ctx.save();
    let font = field.font;
    if (typeof font === 'string' && font.includes('%')) {
      font = Math.floor((parseFloat(font) / 100) * H) + 'px serif';
    }
    _ctx.font = font; _ctx.fillStyle = field.color; _ctx.textAlign = field.align || 'left';
    _ctx.fillText(text, _pct(field.x, W), _pct(field.y, H));
    _ctx.restore();
  }

  function _drawPhoto(img) {
    if (!img || !_ctx) return;
    const pf = CONFIG.fields.photo; if (!pf) return;
    const W = _canvas.width, H = _canvas.height;
    _ctx.save();
    _ctx.beginPath();
    _ctx.rect(_pct(pf.x,W), _pct(pf.y,H), _pct(pf.width,W), _pct(pf.height,H));
    _ctx.clip();
    _ctx.drawImage(img, _pct(pf.x,W), _pct(pf.y,H), _pct(pf.width,W), _pct(pf.height,H));
    _ctx.restore();
  }

  async function _render(studentOrRoll) {
    const student = _resolveStudentData(studentOrRoll);
    if (!_initCanvas()) throw new Error('Canvas not found.');

    if (!_templateImg || !_templateImg.complete || _templateImg.naturalWidth === 0) {
      throw new Error('Template not loaded. Call loadTemplate() first.');
    }

    _canvas.width  = _templateImg.naturalWidth;   // 5662
    _canvas.height = _templateImg.naturalHeight;  // 8000
    console.log('Canvas size:', _canvas.width, 'x', _canvas.height);

    _ctx.imageSmoothingEnabled = true;
    _ctx.imageSmoothingQuality = 'high';
    _ctx.drawImage(_templateImg, 0, 0);

    if (student.photo) {
      try {
        const photoImg = await _loadImage(student.photo, 5000);
        if (photoImg) _drawPhoto(photoImg);
      } catch (e) { console.warn('Photo failed:', e.message); }
    }

    _drawQRCode(student.certificateNumber);
    _drawField(CONFIG.fields.centerName,          student.centerName);
    _drawField(CONFIG.fields.studentNameCombined, student.studentNameCombined);
    _drawField(CONFIG.fields.courseName,          student.courseName);
    _drawField(CONFIG.fields.grade,               student.grade);
    _drawField(CONFIG.fields.gradeExtra,          student.grade);
    _drawField(CONFIG.fields.courseDuration,      (student.courseDuration || '').toUpperCase());
    _drawField(CONFIG.fields.coursePeriodFrom,    student.coursePeriodFrom ? _fmtDate(student.coursePeriodFrom) : '');
    _drawField(CONFIG.fields.coursePeriodTo,      student.coursePeriodTo   ? _fmtDate(student.coursePeriodTo)  : '');
    _drawField(CONFIG.fields.certificateNumber,   student.certificateNumber);
    _drawField(CONFIG.fields.dateOfIssue,         _fmtDate(student.dateOfIssue));
    return _canvas;
  }

  // ── PDF: A4 portrait 210×297mm — fixes Chrome 16% zoom ───────────────────
  // Template is 5662×8000px, ratio 0.7077 ≈ A4 portrait ratio 0.7071.
  // Hardcoding A4 instead of deriving page size from pixels is what fixes
  // Chrome opening at 16% — Chrome recognises A4 as a standard paper size.
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;

    // ── Fix Chrome zoom by matching PDF page size to screen pixels ───────────
    // Chrome opens PDFs at 100% physical size based on page dimensions.
    // Strategy: make the PDF page exactly 800x1132px (in px units) which is
    // a comfortable fit for most screens. Chrome will open it at ~100% zoom.
    // The certificate image is scaled to fill this page exactly.

    const PAGE_PX_W = 800;
    const PAGE_PX_H = Math.round(PAGE_PX_W * (_canvas.height / _canvas.width));

    // Downscale canvas to page pixel dimensions
    const off  = document.createElement('canvas');
    off.width  = PAGE_PX_W;
    off.height = PAGE_PX_H;
    const octx = off.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(_canvas, 0, 0, PAGE_PX_W, PAGE_PX_H);

    const imgData = off.toDataURL('image/jpeg', 0.92);

    // Use px as unit — page size = exact pixel dimensions
    // Chrome reads this as "800x1132 pixel page" and opens at ~100% zoom
    const pdf = new jsPDF({
      orientation: PAGE_PX_W >= PAGE_PX_H ? 'landscape' : 'portrait',
      unit: 'px',
      format: [PAGE_PX_W, PAGE_PX_H],
      hotfixes: ['px_scaling']
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_PX_W, PAGE_PX_H);
    return pdf;
  }

  function _safeName(n) { return (n || 'certificate').replace(/[^a-z0-9_\-]/gi, '_'); }

  function _resolveStudentData(s) {
    if (typeof s === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const f = window.StudentDB.find(s);
        if (f) return {
          centerName: f.centerName||f.center||'', studentNameCombined: f.studentName||f.applicantName||'',
          courseName: f.courseName||'', grade: f.grade||'', courseDuration: f.courseDuration||'',
          coursePeriodFrom: f.coursePeriodFrom||'', coursePeriodTo: f.coursePeriodTo||'',
          certificateNumber: f.certificateNumber||'', dateOfIssue: f.dateOfIssue||'', photo: f.photo||''
        };
      }
      return { studentNameCombined: s };
    }
    return s || {};
  }

  return {
    async loadTemplate(pathOrDataURL, timeout = 5000) {
      _initCanvas();
      const src = pathOrDataURL || CONFIG.templatePath;
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => { img.src=''; _templateImg=null; resolve(null); }, timeout);
        img.onload  = () => { clearTimeout(timer); _templateImg=img; console.log('Template:', img.naturalWidth,'x',img.naturalHeight); resolve(img); };
        img.onerror = () => { clearTimeout(timer); _templateImg=null; resolve(null); };
        img.src = src;
      });
    },

    async preview(s)                   { await _render(s); return _canvas.toDataURL('image/jpeg', 0.7); },
    async getPreviewURL(s)             { return this.preview(s); },
    async getDataURL(s, q=0.6)         { await _render(s); return _canvas.toDataURL('image/jpeg', q); },
    async getCompressedDataURL(s)      { return this.getDataURL(s, 0.4); },

    async download(studentOrRoll) {
      try {
        await _render(studentOrRoll);
        const student = _resolveStudentData(studentOrRoll);
        _canvasToPDF().save(`student_certificate_${_safeName(student.studentNameCombined)}.pdf`);
      } catch (err) {
        console.error('download error:', err);
        alert('Failed to generate PDF: ' + err.message);
      }
    },

    async downloadAll(students, onProgress) {
      if (!Array.isArray(students) || !students.length) return;
      for (let i = 0; i < students.length; i++) {
        await this.download(students[i]);
        if (onProgress) onProgress(i+1, students.length);
        await new Promise(r => setTimeout(r, 350));
      }
    },

    setField(name, overrides)      { if (!CONFIG.fields[name]) throw new Error('Unknown: '+name); Object.assign(CONFIG.fields[name], overrides); },
    updateFieldPositions(f)        { if (f) Object.assign(CONFIG.fields, f); },
    updateConfig(c)                { if (c?.fields) this.updateFieldPositions(c.fields); },

    async fetchConfigFromAPI(base='/api/settings') {
      try {
        const r = await fetch(`${base}/certificate-template`);
        const d = await r.json();
        if (d.success && d.data?.studentCertificate) { CONFIG.fields={...CONFIG.fields,...d.data.studentCertificate}; return true; }
      } catch(e) { console.warn('Config fetch failed:', e); }
      return false;
    },

    get config() { return CONFIG; }
  };
})();

window.CertificateGenerator = CertificateGenerator;