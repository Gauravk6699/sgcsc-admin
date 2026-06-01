// ═══════════════════════════════════════════════════════════════╗
// ║        TYPING CERTIFICATE GENERATOR — DROP-IN MODULE        ║
// ║                                                              ║
// ║  SETUP (do once):                                            ║
// ║    TypingCertificateGenerator.loadTemplate('path/to/template.jpg') ║
// ║                                                              ║
// ║  GENERATE (call whenever you have student data):             ║
// ║    TypingCertificateGenerator.download({ ...studentData })   ║
// ║    TypingCertificateGenerator.preview({ ...studentData }) ← blob  ║
// ║    TypingCertificateGenerator.downloadAll([ ...students ])    ║
// ╚══════════════════════════════════════════════════════════════╝

var TypingCertificateGenerator = (() => {

  // ─────────────────────────────────────────────
  // CONFIGURATION — adjust these positions to match your JPG template
  // All positions are percentage of image width/height (0–100)
  // x: horizontal position (0 = left edge, 100 = right edge)
  // y: vertical position (0 = top edge, 100 = bottom edge)
  // ─────────────────────────────────────────────
  const CONFIG = {
    templatePath: 'typing-certificate-template.jpeg',   // ← path to your template (can be overridden)

    fields: {
      // { x, y } as % of image dimensions. font is px at full resolution.
      studentName:        { x: 63, y: 52.3, font: '200px serif',     color: '#000000', align: 'center' },
      fatherHusbandName:  { x: 32,  y: 57, font: '200px serif',       color: '#000000', align: 'left' },
      motherName:         { x: 70,  y: 57, font: '200px serif',       color: '#000000', align: 'left' },
      enrollmentNumber:   { x: 22.5, y: 77.5, font: '150px serif',    color: '#000000', align: 'left' },
      computerTyping:     { x: 22.5, y: 82, font: '150px serif',      color: '#000000', align: 'left' },
      certificateNo:      { x: 22.5, y: 86.5, font: '150px serif',     color: '#000000', align: 'left' },
      dateOfIssue:        { x: 22.5, y: 90.7, font: '150px serif',     color: '#000000', align: 'left' },
      sessionFrom:        { x: 74,  y: 61, font: '200px serif',       color: '#000000', align: 'left' },
      sessionTo:          { x: 83,  y: 61, font: '200px serif',       color: '#000000', align: 'left' },
      grade:              { x: 86,  y: 65, font: '200px serif',       color: '#000000', align: 'left' },
      studyCentre:        { x: 37,  y: 69.4, font: '200px serif',     color: '#000000', align: 'left' },
      wordsPerMinute:     { x: 28.5, y: 82, font: '150px serif',      color: '#000000', align: 'left' },
    }
  };

  // ─────────────────────────────────────────────
  // Internal state
  // ─────────────────────────────────────────────
  let _templateImg = null;
  let _canvas = null;
  let _ctx = null;

  // ─────────────────────────────────────────────
  // Initialize canvas on load
  // ─────────────────────────────────────────────
  function _initCanvas() {
    if (!_canvas) {
      _canvas = document.getElementById('typingCertCanvas');
      if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.id = 'typingCertCanvas';
        _canvas.style.display = 'none';
        _canvas.width = 800;
        _canvas.height = 600;
        document.body.appendChild(_canvas);
      }
      if (_canvas && !_ctx) {
        _ctx = _canvas.getContext('2d');
      }
    }
    return _canvas && _ctx;
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  function _fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _pct(val, total) { return (val / 100) * total; }

  // Helper to load an image from URL (with cache busting)
  function _loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image: ' + src));
      // Add cache-busting to force reload when template changes
      const separator = src.includes('?') ? '&' : '?';
      img.src = src + separator + '_cb=' + Date.now();
    });
  }

  function _drawField(field, text) {
    if (!text || !_ctx) return;
    const W = _canvas.width, H = _canvas.height;
    _ctx.save();
    _ctx.font = field.font;
    _ctx.fillStyle = field.color;

    if (field.align === 'center') {
      _ctx.textAlign = 'center';
      _ctx.fillText(text, _pct(field.x, W), _pct(field.y, H));
    } else if (field.align === 'right') {
      _ctx.textAlign = 'right';
      _ctx.fillText(text, _pct(field.x, W), _pct(field.y, H));
    } else {
      _ctx.textAlign = 'left';
      _ctx.fillText(text, _pct(field.x, W), _pct(field.y, H));
    }
    _ctx.restore();
  }

  // Helper to resolve typing certificate data from identifier or object
  function _resolveTypingData(dataOrId) {
    if (typeof dataOrId === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const found = window.StudentDB.find(dataOrId);
        if (found) {
          return {
            studentName:        found.studentName || found.applicantName || '',
            fatherHusbandName:  found.fatherName || '',
            motherName:         found.motherName || '',
            enrollmentNumber:   found.enrollmentNo || found.rollNumber || '',
            computerTyping:     found.computerTyping || '',
            certificateNo:      found.certificateNumber || '',
            dateOfIssue:        found.dateOfIssue || '',
            sessionFrom:        found.sessionFrom || '',
            sessionTo:          found.sessionTo || '',
            grade:              found.grade || '',
            studyCentre:        found.studyCentre || '',
            wordsPerMinute:     found.wordsPerMinute || ''
          };
        }
        console.warn('No student found with typing-cert lookup:', dataOrId);
        return {};
      }
      console.warn('StudentDB not available, cannot auto-fill');
      return {};
    }
    return dataOrId || {};
  }

  // ─────────────────────────────────────────────
  // Load template image (REQUIRED - JPG template must exist)
  // ─────────────────────────────────────────────
  async function loadTemplate(path = CONFIG.templatePath, customConfig = null) {
    // Override templatePath if provided in customConfig
    if (customConfig && customConfig.templatePath) {
      CONFIG.templatePath = customConfig.templatePath;
    }
    // Use the path argument, or fall back to the (possibly updated) CONFIG value
    const templatePath = path || CONFIG.templatePath;
    if (!templatePath) throw new Error('Template path required');

    try {
      // Allow overriding field positions via customConfig
      if (customConfig && customConfig.fields) {
        CONFIG.fields = { ...CONFIG.fields, ...customConfig.fields };
      }

      _templateImg = await _loadImage(templatePath);
      if (!_templateImg) {
        throw new Error(`Template image not found at: ${templatePath}. Please ensure the JPG template exists in the public folder.`);
      }

      if (!_initCanvas()) throw new Error('Canvas not available');
      _canvas.width  = _templateImg.width;
      _canvas.height = _templateImg.height;
      _ctx.drawImage(_templateImg, 0, 0);
      console.log(`Template loaded: ${_templateImg.width}x${_templateImg.height}`);
    } catch (err) {
      console.error('Failed to load template:', err);
      throw new Error(`Template loading failed: ${err.message}. Please upload the JPG template to the public folder.`);
    }
  }

  // ─────────────────────────────────────────────
  // Generate certificate data URL
  // ─────────────────────────────────────────────
  async function getDataURL(studentOrId) {
    if (!_templateImg || !_ctx) {
      throw new Error('Template not loaded. Call loadTemplate() first.');
    }

    // Reset canvas to template
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _ctx.drawImage(_templateImg, 0, 0);

    const student = _resolveTypingData(studentOrId);

    _drawField(CONFIG.fields.studentName,        student.studentName);
    _drawField(CONFIG.fields.fatherHusbandName,  student.fatherHusbandName);
    _drawField(CONFIG.fields.motherName,         student.motherName);
    _drawField(CONFIG.fields.enrollmentNumber,   student.enrollmentNumber);
    _drawField(CONFIG.fields.computerTyping,     student.computerTyping);
    _drawField(CONFIG.fields.certificateNo,      student.certificateNo);
    _drawField(CONFIG.fields.dateOfIssue,        _fmtDate(student.dateOfIssue));
    _drawField(CONFIG.fields.sessionFrom,        student.sessionFrom);
    _drawField(CONFIG.fields.sessionTo,          student.sessionTo);
    _drawField(CONFIG.fields.grade,              student.grade);
    _drawField(CONFIG.fields.studyCentre,        student.studyCentre);
    _drawField(CONFIG.fields.wordsPerMinute,     student.wordsPerMinute);

    return _canvas.toDataURL('image/jpeg', 0.95);
  }

  // ─────────────────────────────────────────────
  // Generate and download single certificate
  // ─────────────────────────────────────────────
  async function download(studentOrId) {
    const dataURL = await getDataURL(studentOrId);
    const student = _resolveTypingData(studentOrId);
    const link = document.createElement('a');
    link.download = `typing_certificate_${student.certificateNo || 'unknown'}.jpg`;
    link.href = dataURL;
    link.click();
  }

  // ─────────────────────────────────────────────
  // Get a Blob URL of the certificate (for <img> preview or custom handling)
  // ─────────────────────────────────────────────
  async function preview(studentOrId) {
    const dataURL = await getDataURL(studentOrId);
    return dataURL;
  }

  // ─────────────────────────────────────────────
  // Generate certificates for ALL students one by one
  // ─────────────────────────────────────────────
  async function downloadAll(students) {
    if (!Array.isArray(students)) throw new Error('students must be an array');

    for (const student of students) {
      await download(student);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // ─────────────────────────────────────────────
  // Update field positions dynamically
  // ─────────────────────────────────────────────
  function updateFieldPositions(newFields) {
    if (newFields && typeof newFields === 'object') {
      CONFIG.fields = { ...CONFIG.fields, ...newFields };
      console.log('Field positions updated:', CONFIG.fields);
    }
  }

  // ─────────────────────────────────────────────
  // Update config (alias for updateFieldPositions)
  // ─────────────────────────────────────────────
  function updateConfig(newConfig) {
    if (newConfig && newConfig.fields) {
      updateFieldPositions(newConfig.fields);
    }
  }

  // ─────────────────────────────────────────────
  // Fetch config from API and apply
  // ─────────────────────────────────────────────
  async function fetchConfigFromAPI(apiBaseUrl = '/api/settings') {
    // API config not calibrated for this template — skip to avoid overriding correct positions
    console.log('TypingCertificate: using built-in field positions (API config skipped)');
    return false;
  }

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────
  return {
    loadTemplate,
    getDataURL,
    download,
    preview,
    downloadAll,
    updateFieldPositions,
    updateConfig,
    fetchConfigFromAPI,
    CONFIG,
  };

})();

window.TypingCertificateGenerator = TypingCertificateGenerator;
