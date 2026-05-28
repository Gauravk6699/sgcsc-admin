// ═══════════════════════════════════════════════════════════════╗
// ║       FRANCHISE CERTIFICATE GENERATOR — DROP-IN MODULE      ║
// ║                                                              ║
// ║  SETUP (do once):                                            ║
// ║    FranchiseCertificateGenerator.loadTemplate('path/to/template.jpg') ║
// ║                                                              ║
// ║  TO CUSTOMIZE TEXT POSITIONS:                                ║
// ║    1. Edit CONFIG.fields below with new x,y coordinates     ║
// ║    2. Or call updateFieldPositions({fieldName: {x, y, ...}})║
// ║    3. Coordinates are % of image width/height (0-100)       ║
// ║                                                              ║
// ║  GENERATE (call whenever you have franchise data):           ║
// ║    FranchiseCertificateGenerator.download({ ...franchiseData }) ║
// ║    FranchiseCertificateGenerator.preview({ ...franchiseData }) ← blob ║
// ╚══════════════════════════════════════════════════════════════╝

var FranchiseCertificateGenerator = (() => {

  // ─────────────────────────────────────────────
  // CONFIGURATION — adjust these positions to match your JPG template
  // All positions are percentage of image width/height (0–100)
  // x: horizontal position (0 = left edge, 100 = right edge)
  // y: vertical position (0 = top edge, 100 = bottom edge)
  // ─────────────────────────────────────────────
  const CONFIG = {
    templatePath: 'franchise-certificate-template.jpeg',   // ← path to your template (can be overridden)

    fields: {
      // { x, y } as % of image dimensions. font is px at full resolution.
      trainingCentreName: { x: 50,  y: 44, font: '200px serif',           color: '#000000', align: 'center' },
      applicantName:      { x: 46,  y: 49.7, font: '200px serif',        color: '#000000', align: 'left' },
      atcCode:            { x: 46,  y: 53.3, font: '200px serif',        color: '#000000', align: 'left' },
      atcCode2:           { x: 29,  y: 87.8, font: '130px serif',        color: '#000000', align: 'left' },
      dateOfIssue:        { x: 29,  y: 89.6, font: '130px serif',        color: '#000000', align: 'left' },
      dateOfRenewal:      { x: 29,  y: 91.5, font: '130px serif',        color: '#000000', align: 'left' },
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
      _canvas = document.getElementById('franchiseCertCanvas');
      if (!_canvas) {
        // Create a hidden canvas dynamically if not found
        _canvas = document.createElement('canvas');
        _canvas.id = 'franchiseCertCanvas';
        _canvas.style.display = 'none';
        document.body.appendChild(_canvas);
      }
      if (_canvas) {
        _ctx = _canvas.getContext('2d');
      }
    }
    console.log('Canvas initialized:', { canvas: !!_canvas, ctx: !!_ctx });
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

  // Helper to load an image from URL
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
      img.src = src;
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

  // Helper to resolve franchise data from identifier or object
  function _resolveFranchiseData(franchiseOrId) {
    if (typeof franchiseOrId === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const found = window.StudentDB.find(franchiseOrId);
        if (found) {
          return {
            trainingCentreName: found.trainingCentreName || found.instituteName || found.institutionName || '',
            applicantName:      found.applicantName || found.studentName || '',
            atcCode:            found.atcCode || '',
            atcCode2:           found.atcCode2 || '',
            dateOfIssue:        found.dateOfIssue || '',
            dateOfRenewal:      found.dateOfRenewal || '',
            certificateNumber:  found.certificateNumber || ''
          };
        }
        console.warn('No franchise found with lookup:', franchiseOrId);
        return {};
      }
      console.warn('StudentDB not available, cannot auto-fill');
      return {};
    }
    return franchiseOrId || {};
  }

  // ─────────────────────────────────────────────
  // Load template image (REQUIRED - JPG template must exist)
  // ─────────────────────────────────────────────
  async function loadTemplate(path = CONFIG.templatePath, customConfig = null) {
    if (!path) throw new Error('Template path required');

    try {
      // Allow overriding field positions via customConfig
      if (customConfig && customConfig.fields) {
        CONFIG.fields = { ...CONFIG.fields, ...customConfig.fields };
      }

      _templateImg = await _loadImage(path);
      if (!_templateImg) {
        throw new Error(`Template image not found at: ${path}. Please ensure the JPG template exists in the public folder.`);
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
  async function getDataURL(franchiseOrId) {
    if (!_templateImg || !_ctx) {
      throw new Error('Template not loaded. Call loadTemplate() first.');
    }

    // Reset canvas to template
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _ctx.drawImage(_templateImg, 0, 0);

    const franchise = _resolveFranchiseData(franchiseOrId);

    _drawField(CONFIG.fields.trainingCentreName, franchise.trainingCentreName);
    _drawField(CONFIG.fields.applicantName,      franchise.applicantName);
    _drawField(CONFIG.fields.atcCode,            franchise.atcCode);
    _drawField(CONFIG.fields.atcCode2,           franchise.atcCode2);
    _drawField(CONFIG.fields.dateOfIssue,        _fmtDate(franchise.dateOfIssue));
    _drawField(CONFIG.fields.dateOfRenewal,      _fmtDate(franchise.dateOfRenewal));

    return _canvas.toDataURL('image/jpeg', 0.95);
  }

  // ─────────────────────────────────────────────
  // Generate and download single certificate
  // ─────────────────────────────────────────────
  async function download(franchiseOrId) {
    const dataURL = await getDataURL(franchiseOrId);
    const franchise = _resolveFranchiseData(franchiseOrId);
    const link = document.createElement('a');
    link.download = `franchise_certificate_${franchise.certificateNumber || 'unknown'}.jpg`;
    link.href = dataURL;
    link.click();
  }

  // ─────────────────────────────────────────────
  // Get a Blob URL of the certificate (for <img> preview or custom handling)
  // ─────────────────────────────────────────────
  async function preview(franchiseOrId) {
    const dataURL = await getDataURL(franchiseOrId);
    return dataURL;
  }

  // ─────────────────────────────────────────────
  // Generate certificates for ALL franchises one by one
  // ─────────────────────────────────────────────
  async function downloadAll(franchises) {
    if (!Array.isArray(franchises)) throw new Error('franchises must be an array');

    for (const franchise of franchises) {
      await download(franchise);
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
    // API config is currently not calibrated for the franchise certificate template.
    // Skip loading to avoid overriding correct hardcoded positions.
    console.log('FranchiseCertificate: using built-in field positions (API config skipped)');
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

window.FranchiseCertificateGenerator = FranchiseCertificateGenerator;
