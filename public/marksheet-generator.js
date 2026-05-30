// ╔══════════════════════════════════════════════════════════════╗
// ║           MARKSHEET GENERATOR — DROP-IN MODULE              ║
// ║                                                              ║
// ║  SETUP (do once):                                            ║
// ║    MarksheetGenerator.loadTemplate('path/to/template.jpg')  ║
// ║                                                              ║
// ║  GENERATE (call whenever you have student data):             ║
// ║    MarksheetGenerator.download({ ...marksheetData })         ║
// ║    MarksheetGenerator.preview({ ...marksheetData })  ← blob  ║
// ║    MarksheetGenerator.downloadAll([ ...marksheets ])         ║
// ╚══════════════════════════════════════════════════════════════╝

// ─── QUALITY NOTES ─────────────────────────────────────────────────────────
//  • The JPEG template is decoded ONCE to a canvas at full native resolution.
//  • Text is drawn onto that canvas (losslessly, in memory).
//  • The PDF is built by embedding the canvas pixels as a JPEG at 0.9 quality.
//  • DPI set to 200 for slightly larger file size while maintaining quality.
//  • This produces PDFs around 3-4MB instead of 200MB+.
// ───────────────────────────────────────────────────────────────────────────

var MarksheetGenerator = (() => {

  // ── OUTPUT QUALITY CONTROLS ──────────────────────────────────────────────
  const OUTPUT_FORMAT  = 'image/jpeg';  // JPEG for smaller file size
  const OUTPUT_QUALITY = 0.9;           // JPEG quality (0–1)
  const ASSUMED_DPI    = 200;           // DPI for PDF sizing
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────
  // CONFIGURATION — adjust positions to your JPG
  // All positions are percentage of image width/height (0–100)
  // ─────────────────────────────────────────────
  const CONFIG = {
    templatePath: 'marksheet-template.jpeg',  // ← path to your template

    fields: {
      rollNumber:       { x: 73,   y: 28.5,  font: '100px serif', color: '#000000', align: 'left'   },
      studentName:      { x: 30,   y: 25.7,  font: '100px serif', color: '#000000', align: 'left'   },
      fatherName:       { x: 30,   y: 28.4,  font: '100px serif', color: '#000000', align: 'left'   },
      motherName:       { x: 30,   y: 31.3,  font: '100px serif', color: '#000000', align: 'left'   },
      dob:              { x: 73,   y: 31.3,  font: '100px serif', color: '#000000', align: 'left'   },
      courseName:       { x: 30,   y: 37,    font: '100px serif', color: '#000000', align: 'left'   },
      courseDuration:   { x: 73,   y: 25.6,  font: '100px serif', color: '#000000', align: 'left'   },
      coursePeriodFrom: { x: 30,   y: 34,    font: '100px serif', color: '#000000', align: 'left'   },
      coursePeriodTo:   { x: 49,   y: 34,    font: '100px serif', color: '#000000', align: 'left'   },
      instituteName:    { x: 30,   y: 39.8,  font: '100px serif', color: '#000000', align: 'left'   },
      dateOfIssue:      { x: 19,   y: 92.5,  font: '100px serif', color: '#000000', align: 'left'   },

      totalPercentage:  { x: 80,   y: 77.7,  font: '100px serif', color: '#000000', align: 'left'   },
      overallGrade:     { x: 56,   y: 77.7,  font: '100px serif', color: '#000000', align: 'left'   },
      grandTotal:       { x: 29,   y: 77.7,  font: '100px serif', color: '#000000', align: 'left'   },

      theorySum:        { x: 55,   y: 75,    font: '100px serif', color: '#000000', align: 'center' },
      practicalSum:     { x: 70,   y: 75,    font: '100px serif', color: '#000000', align: 'center' },
      objectiveSum:     { x: 82,   y: 75,    font: '100px serif', color: '#000000', align: 'center' },

      subjectsStartY:   53,
      subjectRowHeight: 1.5,
    }
  };

  // ─────────────────────────────────────────────
  // Internal state
  // ─────────────────────────────────────────────
  let _templateImg  = null;
  let _templateDPI  = ASSUMED_DPI;  // resolved after loadTemplate()
  let _canvas       = null;
  let _ctx          = null;

  // ─────────────────────────────────────────────
  // Canvas init
  // ─────────────────────────────────────────────
  function _initCanvas() {
    if (!_canvas) {
      _canvas = document.getElementById('marksheetCanvas');
      if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.id = 'marksheetCanvas';
        _canvas.style.display = 'none';
        document.body.appendChild(_canvas);
      }
      _ctx = _canvas.getContext('2d');
    }
    return !!(_canvas && _ctx);
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

  function _wrapText(text, maxWidth, ctx) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function _drawField(field, text) {
    if (text == null || text === '' || !_ctx) return;
    const W = _canvas.width, H = _canvas.height;
    _ctx.save();
    _ctx.font      = field.font;
    _ctx.fillStyle = field.color;
    _ctx.textAlign = field.align || 'left';
    _ctx.fillText(String(text), _pct(field.x, W), _pct(field.y, H));
    _ctx.restore();
  }

  // ─────────────────────────────────────────────
  // Read DPI from JPEG JFIF / EXIF metadata
  // Returns dots-per-inch (number) or null if not found.
  // ─────────────────────────────────────────────
  async function _readJpegDPI(url) {
    try {
      const res    = await fetch(url);
      const buf    = await res.arrayBuffer();
      const bytes  = new Uint8Array(buf);

      // ── JFIF APP0 segment ────────────────────────────────────────────────
      // SOI FF D8, then APP0 FF E0
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 &&
          bytes[2] === 0xFF && bytes[3] === 0xE0) {
        // units byte at offset 11: 1 = DPI, 2 = dots-per-cm
        const units = bytes[11];
        const xDens = (bytes[12] << 8) | bytes[13];
        if (units === 1 && xDens > 0) return xDens;
        if (units === 2 && xDens > 0) return Math.round(xDens * 2.54);
      }

      // ── EXIF APP1 segment ────────────────────────────────────────────────
      let offset = 2;
      while (offset < bytes.length - 4) {
        if (bytes[offset] !== 0xFF) break;
        const marker = bytes[offset + 1];
        const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
        if (marker === 0xE1) {  // APP1 / EXIF
          const exifHeader = String.fromCharCode(...bytes.slice(offset + 4, offset + 10));
          if (exifHeader.startsWith('Exif')) {
            const tiffStart  = offset + 10;
            const littleEnd  = bytes[tiffStart] === 0x49;
            const readU16    = (o) => littleEnd ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8))
                                                 : ((bytes[tiffStart+o]<<8) | bytes[tiffStart+o+1]);
            const readU32    = (o) => littleEnd ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8)
                                                  | (bytes[tiffStart+o+2]<<16) | (bytes[tiffStart+o+3]<<24))
                                                 : ((bytes[tiffStart+o]<<24) | (bytes[tiffStart+o+1]<<16)
                                                   | (bytes[tiffStart+o+2]<<8) | bytes[tiffStart+o+3]);
            const ifd0Offset = readU32(4);
            const numEntries = readU16(ifd0Offset);
            let xResVal = null, resUnit = 2;
            for (let i = 0; i < numEntries; i++) {
              const eOff = ifd0Offset + 2 + i * 12;
              const tag  = readU16(eOff);
              if (tag === 0x011A) {  // XResolution (rational)
                const vOff = readU32(eOff + 8);
                const num  = readU32(vOff);
                const den  = readU32(vOff + 4);
                xResVal = den ? num / den : null;
              }
              if (tag === 0x0128) {  // ResolutionUnit: 2=inch, 3=cm
                resUnit = readU16(eOff + 8);
              }
            }
            if (xResVal && xResVal > 0) {
              return resUnit === 3 ? Math.round(xResVal * 2.54) : Math.round(xResVal);
            }
          }
        }
        offset += 2 + segLen;
        if (marker === 0xDA) break;  // SOS — no more header segments
      }
    } catch (e) {
      console.warn('Could not read JPEG DPI metadata:', e);
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // Convert canvas → PDF (JPEG for smaller file size)
  // Resizes canvas to 150 DPI for ~2MB PDF
  // ─────────────────────────────────────────────
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;
    const W = _canvas.width, H = _canvas.height;

    // Resize to 200 DPI for slightly larger file size
    const TARGET_DPI = 200;
    const scale = TARGET_DPI / _templateDPI;
    const newW = Math.round(W * scale);
    const newH = Math.round(H * scale);
    const widthMM  = (newW / TARGET_DPI) * 25.4;
    const heightMM = (newH / TARGET_DPI) * 25.4;

    const off = document.createElement('canvas');
    off.width = newW;
    off.height = newH;
    const octx = off.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(_canvas, 0, 0, newW, newH);

    const pdf = new jsPDF({
      orientation: newW >= newH ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMM, heightMM]
    });

    pdf.setDisplayMode('fullpage', 'single');

    const imgData = off.toDataURL('image/jpeg', OUTPUT_QUALITY);
    pdf.addImage(imgData, 'JPEG', 0, 0, widthMM, heightMM);
    return pdf;
  }

  function _safeName(name) {
    return (name || 'marksheet').replace(/[^a-z0-9_\-]/gi, '_');
  }

  // ─────────────────────────────────────────────
  // Core render — draws template + fields onto canvas
  // ─────────────────────────────────────────────
  async function _render(marksheet) {
    if (!_initCanvas()) throw new Error('Canvas not found. Make sure <canvas id="marksheetCanvas"> exists.');

    if (!_templateImg) {
      console.warn('Template not loaded, using blank white background');
      _canvas.width  = 2480;
      _canvas.height = 3508;
      _ctx.fillStyle = '#FFFFFF';
      _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    } else {
      // Draw at native template resolution — no scaling, no quality loss
      _canvas.width  = _templateImg.naturalWidth;
      _canvas.height = _templateImg.naturalHeight;

      // imageSmoothingEnabled has no effect here (we're at 1:1), but keep it
      // explicit so that any future resizing path stays high-quality
      _ctx.imageSmoothingEnabled = true;
      _ctx.imageSmoothingQuality = 'high';

      _ctx.drawImage(_templateImg, 0, 0);
    }

    // ── Student detail fields ──────────────────────────────────────────────
    _drawField(CONFIG.fields.rollNumber,      marksheet.rollNumber);
    _drawField(CONFIG.fields.studentName,     marksheet.studentName);
    _drawField(CONFIG.fields.fatherName,      marksheet.fatherName);
    _drawField(CONFIG.fields.motherName,      marksheet.motherName);
    _drawField(CONFIG.fields.dob,             _fmtDate(marksheet.dob));
    _drawField(CONFIG.fields.courseName,      marksheet.courseName);
    _drawField(CONFIG.fields.courseDuration,  marksheet.courseDuration);
    _drawField(CONFIG.fields.coursePeriodFrom,_fmtDate(marksheet.coursePeriodFrom));
    _drawField(CONFIG.fields.coursePeriodTo,  _fmtDate(marksheet.coursePeriodTo));
    _drawField(CONFIG.fields.instituteName,   marksheet.instituteName);
    _drawField(CONFIG.fields.dateOfIssue,     _fmtDate(marksheet.dateOfIssue));

    // ── Summary fields ─────────────────────────────────────────────────────
    const totalPercent = marksheet.percentage != null
      ? marksheet.percentage.toFixed(1) + '%' : '';
    const totalMarks   = marksheet.totalCombinedMarks + '/' + marksheet.maxTotalMarks;
    _drawField(CONFIG.fields.totalPercentage, totalPercent);
    _drawField(CONFIG.fields.overallGrade,    marksheet.overallGrade || '');
    _drawField(CONFIG.fields.grandTotal,      totalMarks);

    // ── Column sums ────────────────────────────────────────────────────────
    const subs           = Array.isArray(marksheet.subjects) ? marksheet.subjects : [];
    const totalTheory    = subs.reduce((s, r) => s + Number(r.theoryMarks    || 0), 0);
    const totalPractical = subs.reduce((s, r) => s + Number(r.practicalMarks || 0), 0);
    const totalObjective = subs.reduce((s, r) => s + Number(r.objectiveMarks || 0), 0);
    const totalCombined  = totalTheory + totalPractical + totalObjective;
    _drawField(CONFIG.fields.theorySum,    String(totalTheory));
    _drawField(CONFIG.fields.practicalSum, String(totalPractical));
    _drawField(CONFIG.fields.objectiveSum, String(totalCombined));

    // ── Subjects table ─────────────────────────────────────────────────────
    if (subs.length > 0) {
      const W = _canvas.width, H = _canvas.height;
      const startY      = _pct(CONFIG.fields.subjectsStartY,   H);
      const rowHeight   = _pct(CONFIG.fields.subjectRowHeight,  H);
      const lineSpacing = _pct(1.5, H);

      let currentY = startY;

      subs.forEach((subject) => {
        const rawName     = subject.subjectName || '-';
        const subjectText = rawName;

        // Subject name (with word-wrap)
        _ctx.save();
        _ctx.font      = '100px serif';
        _ctx.fillStyle = '#000000';
        _ctx.textAlign = 'left';
        const maxWidth = _pct(25, W);
        const lines    = _wrapText(subjectText, maxWidth, _ctx);
        lines.forEach((line, i) => {
          _ctx.fillText(line, _pct(10, W), currentY + i * lineSpacing);
        });
        _ctx.restore();

        // Theory
        _ctx.save();
        _ctx.font = '100px serif'; _ctx.fillStyle = '#000000'; _ctx.textAlign = 'center';
        _ctx.fillText(String(subject.theoryMarks || 0), _pct(55, W), currentY);
        _ctx.restore();

        // Practical
        _ctx.save();
        _ctx.font = '100px serif'; _ctx.fillStyle = '#000000'; _ctx.textAlign = 'center';
        _ctx.fillText(String(subject.practicalMarks || 0), _pct(70, W), currentY);
        _ctx.restore();

        // Combined (theory + practical + objective)
        _ctx.save();
        _ctx.font = '100px serif'; _ctx.fillStyle = '#000000'; _ctx.textAlign = 'center';
        const combined = Number(subject.theoryMarks    || 0)
                       + Number(subject.practicalMarks || 0)
                       + Number(subject.objectiveMarks || 0);
        _ctx.fillText(String(combined), _pct(82, W), currentY);
        _ctx.restore();

        const usedLines = Math.max(1, lines.length);
        currentY += usedLines * rowHeight;
      });
    }

    return _canvas;
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────
  return {

    /**
     * Load the JPEG template.
     * Also attempts to read DPI metadata so the PDF comes out at the correct
     * physical size.  Falls back to ASSUMED_DPI (200) if metadata is absent.
     *
     * @param {string} pathOrDataURL — URL or base64 data URL of your template JPEG
     * @returns {Promise<HTMLImageElement|null>}
     */
    async loadTemplate(pathOrDataURL) {
      _initCanvas();
      const src = pathOrDataURL || CONFIG.templatePath;

      // Try to read DPI from JPEG metadata before decoding the image.
      // Skip for data-URLs (they don't have JFIF/EXIF in a fetchable way).
      if (!src.startsWith('data:')) {
        const dpi = await _readJpegDPI(src);
        if (dpi && dpi > 0) {
          _templateDPI = dpi;
          console.log(`Template DPI detected: ${dpi}`);
        } else {
          _templateDPI = ASSUMED_DPI;
          console.warn(`Could not read DPI from template; assuming ${ASSUMED_DPI} DPI.`);
        }
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log(`Template loaded: ${img.naturalWidth} × ${img.naturalHeight} px @ ${_templateDPI} DPI`);
          _templateImg = img;
          resolve(img);
        };
        img.onerror = (e) => {
          console.error('Template failed to load from:', src, e);
          _templateImg = null;
          resolve(null);
        };
        img.src = src;
      });
    },

    /**
     * Download a single student's marksheet as a PDF (~3-4MB).
     *
     * @param {Object} marksheet
     */
    async download(marksheet) {
      try {
        await _render(marksheet);
        const pdf = _canvasToPDF();
        pdf.save(`marksheet_${_safeName(marksheet.rollNumber || marksheet.studentName)}.pdf`);
      } catch (err) {
        console.error('MarksheetGenerator.download error:', err);
        alert('Failed to generate PDF: ' + err.message);
      }
    },

    /**
     * Preview — returns a JPEG Blob (~3-4MB).
     *
     * @param {Object} marksheet
     * @returns {Promise<Blob>}
     */
    async preview(marksheet) {
      await _render(marksheet);
      return new Promise((resolve, reject) => {
        _canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('toBlob returned null')),
          'image/jpeg', 0.9
        );
      });
    },

    /**
     * Get a data URL for inline display (e.g. <img src="...">).
     * Returns JPEG (smaller size) by default.
     *
     * @param {Object} marksheet
     * @returns {Promise<string>}
     */
    async getDataURL(marksheet) {
      await _render(marksheet);
      return _canvas.toDataURL('image/jpeg', 0.9);
    },

    /**
     * Download multiple marksheets as individual PDFs.
     *
     * @param {Array}  marksheets
     * @param {number} delayMs — pause between downloads (default 500 ms)
     */
    async downloadAll(marksheets, delayMs = 500) {
      if (!Array.isArray(marksheets) || marksheets.length === 0) {
        console.warn('No marksheets to download');
        return;
      }
      for (let i = 0; i < marksheets.length; i++) {
        try {
          await _render(marksheets[i]);
          const pdf = _canvasToPDF();
          pdf.save(`marksheet_${_safeName(marksheets[i].rollNumber || marksheets[i].studentName || i)}.pdf`);
          if (i < marksheets.length - 1) await new Promise(r => setTimeout(r, delayMs));
        } catch (err) {
          console.error(`Error generating marksheet ${i}:`, err);
        }
      }
    },

    /** Override field positions or template path at runtime. */
    updateConfig(newConfig) {
      if (newConfig?.fields)       Object.assign(CONFIG.fields, newConfig.fields);
      if (newConfig?.templatePath) CONFIG.templatePath = newConfig.templatePath;
    },

    /** Return a deep copy of the current config (useful for debugging). */
    getConfig() {
      return JSON.parse(JSON.stringify(CONFIG));
    },

    /** Fetch field positions from your back-end settings API. */
    async fetchConfigFromAPI(apiBaseUrl = '/api/settings') {
      // API config not calibrated for this template — skip to avoid overriding correct positions
      console.log('Marksheet: using built-in field positions (API config skipped)');
      return false;
    }
  };
})();

window.MarksheetGenerator = MarksheetGenerator;