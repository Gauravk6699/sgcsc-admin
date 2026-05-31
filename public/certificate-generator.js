// ╔══════════════════════════════════════════════════════════════╗
// ║           CERTIFICATE GENERATOR — DROP-IN MODULE            ║
// ╚══════════════════════════════════════════════════════════════╝

var CertificateGenerator = (() => {

  let VERIFY_BASE_URL = 'https://sgcsc.in';

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
      coursePeriodFrom:     { x: 41.5, y: 64.3, font: '156px serif', color: '#000000', align: 'left'   },
      coursePeriodTo:       { x: 61,   y: 64.3, font: '156px serif', color: '#000000', align: 'left'   },
      certificateNumber:    { x: 23,   y: 93,   font: '100px serif', color: '#000000', align: 'left'   },
      dateOfIssue:          { x: 55,   y: 93,   font: '100px serif', color: '#000000', align: 'left'   },
      qrCode:               { x: 19.7, y: 85.8, width: 12.5, height: 11.5 }
    }
  };

  let _templateImg = null;
  let _canvas      = null;
  let _ctx                = null;

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
      new QRious({ element: qrCanvas, value: verifyUrl, size: size, background: null, foreground: 'black' });
      _ctx.save();
      _ctx.fillStyle = 'white';
      _ctx.fillRect(x, y, size, size);
      _ctx.globalCompositeOperation = 'source-over';
      _ctx.drawImage(qrCanvas, x, y, size, size);
      _ctx.restore();
      console.log('QR drawn at', x, y, size, 'for', verifyUrl);
    } catch (e) {
      console.warn('QR failed:', e.message);
      _ctx.save();
      _ctx.fillStyle = 'white';
      _ctx.fillRect(x, y, size, size);
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

    _canvas.width  = _templateImg.naturalWidth;
    _canvas.height = _templateImg.naturalHeight;
    console.log('Canvas size:', _canvas.width, 'x', _canvas.height);

    _ctx.imageSmoothingEnabled = true;
    _ctx.imageSmoothingQuality = 'high';
    _ctx.drawImage(_templateImg, 0, 0);

    if (student.photo) {
      console.log('Photo URL found:', student.photo.substring(0, 80) + '...');
      try {
        const photoImg = await _loadImage(student.photo, 10000);
        if (photoImg) {
          console.log('Photo loaded successfully:', photoImg.width, 'x', photoImg.height);
          _drawPhoto(photoImg);
        } else {
          console.warn('Photo loaded but returned null');
        }
      } catch (e) { console.warn('Photo failed to load:', e.message); }
    } else {
      console.log('No photo URL in student data');
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

  // ── PDF: A4 portrait 210×297mm ────────────────────────────────────────────
  //
  // Target file size: ~2.5 MB
  // Achieved by rendering the full composite canvas (template + text + photo
  // + QR) at native resolution (5662×8000) and encoding as JPEG quality 0.60.
  // At this resolution/quality combination the output is consistently ~2.5 MB
  // while remaining visually sharp at normal zoom levels.
  //
  // jsPDF receives a single pre-encoded dataURL and embeds it with
  // compression:'NONE' so it does NOT apply a second lossy pass on top.
  //
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;

    const PAGE_W_MM = 210;
    const PAGE_H_MM = 297;

    // Render at native canvas resolution (5662×8000).
    // Browser toDataURL quality scale is non-linear — quality=0.92 maps to
    // approximately PIL q=75 on this image, producing ~2.5 MB output.
    // No downsampling needed; native resolution keeps text and photo sharp.
    const imgData = _canvas.toDataURL('image/jpeg', 0.92);
    console.log('PDF encoded size ~',
      Math.round(imgData.length * 0.75 / 1024 / 1024 * 10) / 10, 'MB');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
    });

    // 'NONE' → jsPDF embeds our pre-encoded JPEG as-is, no second compression pass
    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W_MM, PAGE_H_MM, '', 'NONE');

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

    // ── loadTemplate ─────────────────────────────────────────────────────────
    async loadTemplate(pathOrDataURL, timeout = 5000) {
      _initCanvas();
      const src = pathOrDataURL || CONFIG.templatePath;

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => { img.src=''; _templateImg=null; resolve(null); }, timeout);
        img.onload  = () => { clearTimeout(timer); _templateImg=img; console.log('Template img:', img.naturalWidth,'x',img.naturalHeight); resolve(img); };
        img.onerror = () => { clearTimeout(timer); _templateImg=null; resolve(null); };
        img.src = src;
      });
    },

    // ── loadTemplateFromFile ──────────────────────────────────────────────────
    // Use this when the template is loaded via <input type="file"> (local file).
    async loadTemplateFromFile(file, timeout = 5000) {
      _initCanvas();
      if (!(file instanceof Blob)) throw new Error('loadTemplateFromFile expects a File or Blob');
      const objectURL = URL.createObjectURL(file);
      return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => { img.src=''; _templateImg=null; resolve(null); }, timeout);
        img.onload  = () => { clearTimeout(timer); _templateImg=img; URL.revokeObjectURL(objectURL); resolve(img); };
        img.onerror = () => { clearTimeout(timer); _templateImg=null; URL.revokeObjectURL(objectURL); resolve(null); };
        img.src = objectURL;
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

    async getImageDataURL(studentOrRoll) {
      try {
        await _render(studentOrRoll);
        const W = _canvas.width, H = _canvas.height;
        const off = document.createElement('canvas');
        const MAX_DIM = 2000;
        let offW = W, offH = H;
        if (W > MAX_DIM || H > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / W, MAX_DIM / H);
          offW = Math.round(W * ratio);
          offH = Math.round(H * ratio);
        }
        off.width = offW;
        off.height = offH;
        const octx = off.getContext('2d');
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = 'high';
        octx.drawImage(_canvas, 0, 0, offW, offH);
        return off.toDataURL('image/jpeg', 0.95);
      } catch (err) {
        console.error('getImageDataURL error:', err);
        throw err;
      }
    },

    async getPDFDataURL(studentOrRoll) {
      try {
        await _render(studentOrRoll);
        const pdf = _canvasToPDF();
        return pdf.output('datauristring');
      } catch (err) {
        console.error('getPDFDataURL error:', err);
        throw err;
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

    setVerifyBaseUrl(url) {
      if (url) VERIFY_BASE_URL = url;
    },

    setField(name, overrides)      { if (!CONFIG.fields[name]) throw new Error('Unknown: '+name); Object.assign(CONFIG.fields[name], overrides); },
    updateFieldPositions(f)        { if (f) Object.assign(CONFIG.fields, f); },
    updateConfig(c)                { if (c?.fields) this.updateFieldPositions(c.fields); },

    async fetchConfigFromAPI(base='/api/settings') {
      console.log('Certificate: using built-in field positions (API config skipped)');
      return false;
    },

    get config() { return CONFIG; }
  };
})();

window.CertificateGenerator = CertificateGenerator;