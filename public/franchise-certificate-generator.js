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
      // maxWidth (% of image width) enables auto-shrink-to-fit + a hard clip
      // backstop so long text can never run off its printed box.
      trainingCentreName: { x: 50,  y: 44, font: '200px serif',           color: '#000000', align: 'center', maxWidth: 80 },
      // address position is a best-effort placement below trainingCentreName —
      // verify against the actual template image and adjust x/y if needed.
      address:            { x: 50,  y: 47, font: '140px serif',           color: '#000000', align: 'center', maxWidth: 80, minFont: 40 },
      applicantName:      { x: 46,  y: 49.7, font: '200px serif',        color: '#000000', align: 'left',   maxWidth: 45 },
      atcCode:            { x: 46,  y: 53.3, font: '200px serif',        color: '#000000', align: 'left',   maxWidth: 45 },
      atcCode2:           { x: 29,  y: 87.8, font: '130px serif',        color: '#000000', align: 'left',   maxWidth: 30 },
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
    _ctx.font = font;
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

  // Helper to resolve franchise data from identifier or object
  function _resolveFranchiseData(franchiseOrId) {
    if (typeof franchiseOrId === 'string') {
      if (typeof window !== 'undefined' && window.StudentDB) {
        const found = window.StudentDB.find(franchiseOrId);
        if (found) {
          return {
            trainingCentreName: found.trainingCentreName || found.instituteName || found.institutionName || '',
            address:            found.address || '',
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
    _drawField(CONFIG.fields.address,            franchise.address);
    _drawField(CONFIG.fields.applicantName,      franchise.applicantName);
    _drawField(CONFIG.fields.atcCode,            franchise.atcCode);
    _drawField(CONFIG.fields.atcCode2,           franchise.atcCode2);
    _drawField(CONFIG.fields.dateOfIssue,        _fmtDate(franchise.dateOfIssue));
    _drawField(CONFIG.fields.dateOfRenewal,      _fmtDate(franchise.dateOfRenewal));

    return _canvas.toDataURL('image/jpeg', 0.95);
  }

  // Wraps the rendered canvas in a PDF sized to match the certificate image
  // exactly (no stretching/cropping), mirroring CertificateGenerator's approach.
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;
    const imgData = _canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: _canvas.width > _canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [_canvas.width, _canvas.height],
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, _canvas.width, _canvas.height, '', 'NONE');
    return pdf;
  }

  // ─────────────────────────────────────────────
  // Generate and download single certificate (as PDF)
  // ─────────────────────────────────────────────
  async function download(franchiseOrId) {
    await getDataURL(franchiseOrId);
    const franchise = _resolveFranchiseData(franchiseOrId);
    _canvasToPDF().save(`franchise_certificate_${franchise.atcCode || 'unknown'}.pdf`);
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
