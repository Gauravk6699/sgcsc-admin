// ╔══════════════════════════════════════════════════════════════╗
// ║           ADMIT CARD GENERATOR — DROP-IN MODULE              ║
// ║                                                              ║
// ║  SETUP (do once):                                            ║
// ║    AdmitCardGenerator.loadTemplate('path/to/template.jpg')  ║
// ║                                                              ║
// ║  GENERATE (call whenever you have student data):             ║
// ║    AdmitCardGenerator.download({ ...admitCardData })         ║
// ║    AdmitCardGenerator.preview({ ...admitCardData })  ← blob  ║
// ║    AdmitCardGenerator.downloadAll([ ...admitCards ])         ║
// ╚══════════════════════════════════════════════════════════════╝

// Prevent re-declaration if already defined
if (typeof AdmitCardGenerator !== 'undefined') {
  console.warn('AdmitCardGenerator already defined, skipping re-declaration');
} else {
var AdmitCardGenerator = (() => {

  const CONFIG = {
    templatePath: 'admit-card-template.jpeg',
    canvasWidth: null,
    canvasHeight: null,

    fields: {
      photo:             { x: 74,   y: 25.5,   width: 14, height: 12 },
      rollNumber:        { x: 33,   y: 28.2,   font: '120px serif', color: '#000000', align: 'left' },
      studentName:       { x: 33,   y: 30.3,   font: '120px serif', color: '#000000', align: 'left' },
      fatherName:        { x: 33,   y: 32.2, font: '120px serif', color: '#000000', align: 'left' },
      motherName:        { x: 33,   y: 34.5,   font: '120px serif', color: '#000000', align: 'left' },
      courseName:        { x: 28,   y: 40.9,   font: '120px serif', color: '#000000', align: 'left' },
      instituteName:     { x: 28,   y: 47.7,   font: '120px serif', color: '#000000', align: 'left' },
      examCenterAddress: { x: 28,   y: 53,   font: '120px serif', color: '#000000', align: 'left' },
      examDate:          { x: 43,   y: 57.8, font: '120px serif', color: '#000000', align: 'left' },
      examTime:          { x: 43,   y: 60,   font: '120px serif', color: '#000000', align: 'left' },
      reportingTime:     { x: 43,   y: 62.2, font: '120px serif', color: '#000000', align: 'left' },
      examDuration:      { x: 43,   y: 64.3, font: '120px serif', color: '#000000', align: 'left' },
    }
  };

  let _templateImg = null;
  let _canvas = null;
  let _ctx = null;

  function _initCanvas() {
    if (!_canvas) {
      _canvas = document.getElementById('admitCardCanvas');
      if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.id = 'admitCardCanvas';
        _canvas.style.display = 'none';
        document.body.appendChild(_canvas);
      }
      if (_canvas) {
        _ctx = _canvas.getContext('2d');
      }
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

  function _resolveAdmitCardData(admitCardOrRoll) {
    if (typeof admitCardOrRoll === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const found = window.StudentDB.find(admitCardOrRoll);
        if (found) {
          return {
            rollNumber:        found.rollNumber || found.enrollmentNo || admitCardOrRoll,
            studentName:       found.studentName || found.name || '',
            fatherName:        found.fatherName || '',
            motherName:        found.motherName || '',
            courseName:        found.courseName || '',
            instituteName:     found.instituteName || found.institutionName || '',
            examCenterAddress: found.examCenterAddress || '',
            examDate:          found.examDate || '',
            examTime:          found.examTime || '',
            reportingTime:     found.reportingTime || '',
            examDuration:      found.examDuration || '',
            photo:             found.photo || ''
          };
        }
        console.warn('No student found with roll/admit-card lookup:', admitCardOrRoll);
        return { rollNumber: admitCardOrRoll };
      }
      console.warn('StudentDB not available, cannot auto-fill');
      return { rollNumber: admitCardOrRoll };
    }
    return admitCardOrRoll || {};
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

  async function _render(admitCard) {
    const data = _resolveAdmitCardData(admitCard);
    if (!_templateImg) throw new Error('Template not loaded. Call AdmitCardGenerator.loadTemplate() first.');
    if (!_initCanvas()) throw new Error('Canvas not found. Make sure <canvas id="admitCardCanvas"> exists.');

    _canvas.width  = CONFIG.canvasWidth  || _templateImg.naturalWidth;
    _canvas.height = CONFIG.canvasHeight || _templateImg.naturalHeight;
    _ctx.imageSmoothingEnabled = true;
    _ctx.imageSmoothingQuality = 'high';
    _ctx.drawImage(_templateImg, 0, 0);

    if (data.photo) {
      try {
        const photoImg = await _loadImage(data.photo);
        if (photoImg) {
          const pf = CONFIG.fields.photo;
          if (pf) {
            const x = _pct(pf.x, _canvas.width);
            const y = _pct(pf.y, _canvas.height);
            const w = _pct(pf.width,  _canvas.width);
            const h = _pct(pf.height, _canvas.height);
            _ctx.drawImage(photoImg, x, y, w, h);
          }
        }
      } catch (e) {
        console.warn('Could not load student photo:', e);
      }
    }

    _drawField(CONFIG.fields.rollNumber,        data.rollNumber);
    _drawField(CONFIG.fields.studentName,       data.studentName);
    _drawField(CONFIG.fields.fatherName,        data.fatherName);
    _drawField(CONFIG.fields.motherName,        data.motherName);
    _drawField(CONFIG.fields.courseName,        data.courseName);
    _drawField(CONFIG.fields.instituteName,     data.instituteName);
    _drawField(CONFIG.fields.examCenterAddress, data.examCenterAddress);
    _drawField(CONFIG.fields.examDate,          _fmtDate(data.examDate));
    _drawField(CONFIG.fields.examTime,          data.examTime);
    _drawField(CONFIG.fields.reportingTime,     data.reportingTime);
    _drawField(CONFIG.fields.examDuration,      data.examDuration);

    return _canvas;
  }

  // ── PDF generation — A4 page size so Chrome opens at normal zoom ──────────
  // Using unit:'px' with custom pixel dimensions causes Chrome to open at
  // ~16% zoom. Forcing A4 makes Chrome open at a sensible default zoom level.
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;
    const W = _canvas.width, H = _canvas.height;
    const isLandscape = W > H;
    const pageW = isLandscape ? 297 : 210;  // A4 in mm
    const pageH = isLandscape ? 210 : 297;

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Lossless JPEG embed — smaller file size
    const imgData = _canvas.toDataURL('image/jpeg', 0.85);
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
    return pdf;
  }

  function _safeName(name) {
    return (name || 'admit-card').replace(/[^a-z0-9_\-]/gi, '_');
  }

  return {

    loadTemplate(pathOrDataURL) {
      return new Promise((resolve, reject) => {
        _initCanvas();
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => { _templateImg = img; resolve(img); };
        img.onerror = (e) => { console.error('Image load error:', e); reject(new Error('Failed to load template: ' + (pathOrDataURL || CONFIG.templatePath))); };
        img.src = pathOrDataURL || CONFIG.templatePath;
      });
    },

    async download(admitCardOrRoll) {
      try {
        await _render(admitCardOrRoll);
        const pdf      = _canvasToPDF();
        const resolved = _resolveAdmitCardData(admitCardOrRoll);
        pdf.save(`admit-card_${_safeName(resolved.rollNumber || resolved.studentName)}.pdf`);
      } catch (err) {
        console.error('AdmitCardGenerator.download error:', err);
        alert('Failed to generate PDF: ' + err.message);
      }
    },

    async preview(admitCardOrRoll) {
      await _render(admitCardOrRoll);
      return new Promise((resolve, reject) => {
        _canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob returned null')), 'image/png');
      });
    },

    async downloadAll(items, delayMs = 500) {
      if (!Array.isArray(items) || items.length === 0) {
        console.warn('No admit cards to download');
        return;
      }
      for (let i = 0; i < items.length; i++) {
        try {
          await _render(items[i]);
          const pdf      = _canvasToPDF();
          const resolved = _resolveAdmitCardData(items[i]);
          pdf.save(`admit-card_${_safeName(resolved.rollNumber || resolved.studentName || i)}.pdf`);
          if (i < items.length - 1) await new Promise(r => setTimeout(r, delayMs));
        } catch (err) {
          console.error(`Error generating admit card ${i}:`, err);
        }
      }
    },

    updateConfig(newConfig) {
      if (newConfig && newConfig.fields)       Object.assign(CONFIG.fields, newConfig.fields);
      if (newConfig && newConfig.templatePath) CONFIG.templatePath = newConfig.templatePath;
    },

    getConfig() {
      return JSON.parse(JSON.stringify(CONFIG));
    }
  };
})();
}