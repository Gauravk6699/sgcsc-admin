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

var MarksheetGenerator = (() => {

  // ── OUTPUT QUALITY CONTROLS ──────────────────────────────────────────────
  const OUTPUT_FORMAT  = 'image/jpeg';
  const OUTPUT_QUALITY = 0.95;           // used only for preview/getDataURL
  const ASSUMED_DPI    = 200;
  // ─────────────────────────────────────────────────────────────────────────

  const CONFIG = {
    templatePath: 'marksheet-template.jpeg',

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

  let _templateImg  = null;
  let _templateDPI  = ASSUMED_DPI;
  let _canvas       = null;
  let _ctx          = null;

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

  async function _readJpegDPI(url) {
    try {
      const res   = await fetch(url);
      const buf   = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);

      if (bytes[0] === 0xFF && bytes[1] === 0xD8 &&
          bytes[2] === 0xFF && bytes[3] === 0xE0) {
        const units = bytes[11];
        const xDens = (bytes[12] << 8) | bytes[13];
        if (units === 1 && xDens > 0) return xDens;
        if (units === 2 && xDens > 0) return Math.round(xDens * 2.54);
      }

      let offset = 2;
      while (offset < bytes.length - 4) {
        if (bytes[offset] !== 0xFF) break;
        const marker = bytes[offset + 1];
        const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
        if (marker === 0xE1) {
          const exifHeader = String.fromCharCode(...bytes.slice(offset + 4, offset + 10));
          if (exifHeader.startsWith('Exif')) {
            const tiffStart = offset + 10;
            const littleEnd = bytes[tiffStart] === 0x49;
            const readU16 = (o) => littleEnd
              ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8))
              : ((bytes[tiffStart+o]<<8) | bytes[tiffStart+o+1]);
            const readU32 = (o) => littleEnd
              ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8) | (bytes[tiffStart+o+2]<<16) | (bytes[tiffStart+o+3]<<24))
              : ((bytes[tiffStart+o]<<24) | (bytes[tiffStart+o+1]<<16) | (bytes[tiffStart+o+2]<<8) | bytes[tiffStart+o+3]);
            const ifd0Offset = readU32(4);
            const numEntries = readU16(ifd0Offset);
            let xResVal = null, resUnit = 2;
            for (let i = 0; i < numEntries; i++) {
              const eOff = ifd0Offset + 2 + i * 12;
              const tag  = readU16(eOff);
              if (tag === 0x011A) {
                const vOff = readU32(eOff + 8);
                const num  = readU32(vOff);
                const den  = readU32(vOff + 4);
                xResVal = den ? num / den : null;
              }
              if (tag === 0x0128) resUnit = readU16(eOff + 8);
            }
            if (xResVal && xResVal > 0)
              return resUnit === 3 ? Math.round(xResVal * 2.54) : Math.round(xResVal);
          }
        }
        offset += 2 + segLen;
        if (marker === 0xDA) break;
      }
    } catch (e) {
      console.warn('Could not read JPEG DPI metadata:', e);
    }
    return null;
  }

  // ── PDF generation ────────────────────────────────────────────────────────
  //
  // TARGET: ~2 MB
  //
  // The marksheet template is 5662×8000px. The original code downsampled to
  // TARGET_DPI=150 before encoding, which produced only ~1 MB.
  //
  // Fix: render at native resolution (no downsampling) + toDataURL(0.92).
  // Browser quality 0.92 ≈ PIL q=75 on this image → ~2.3 MB.
  // A4 portrait (210×297mm) so Chrome opens at normal zoom.
  // 'NONE' compression flag prevents jsPDF's second lossy pass.
  //
  function _canvasToPDF() {
    const { jsPDF } = window.jspdf;

    const PAGE_W_MM = 210;
    const PAGE_H_MM = 297;

    // Native resolution, quality 0.92 → ~2.3 MB on this template
    const imgData = _canvas.toDataURL('image/jpeg', 0.92);
    console.log('Marksheet PDF encoded ~',
      Math.round(imgData.length * 0.75 / 1024 / 1024 * 10) / 10, 'MB');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
    });

    // 'NONE' → embed pre-encoded JPEG as-is, no second compression pass
    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W_MM, PAGE_H_MM, '', 'NONE');
    return pdf;
  }

  function _safeName(name) {
    return (name || 'marksheet').replace(/[^a-z0-9_\-]/gi, '_');
  }

  async function _render(marksheet) {
    if (!_initCanvas()) throw new Error('Canvas not found. Make sure <canvas id="marksheetCanvas"> exists.');

    if (!_templateImg) {
      console.warn('Template not loaded, using blank white background');
      _canvas.width  = 2480;
      _canvas.height = 3508;
      _ctx.fillStyle = '#FFFFFF';
      _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
    } else {
      _canvas.width  = _templateImg.naturalWidth;
      _canvas.height = _templateImg.naturalHeight;
      _ctx.imageSmoothingEnabled = true;
      _ctx.imageSmoothingQuality = 'high';
      _ctx.drawImage(_templateImg, 0, 0);
    }

    _drawField(CONFIG.fields.rollNumber,       marksheet.rollNumber);
    _drawField(CONFIG.fields.studentName,      marksheet.studentName);
    _drawField(CONFIG.fields.fatherName,       marksheet.fatherName);
    _drawField(CONFIG.fields.motherName,       marksheet.motherName);
    _drawField(CONFIG.fields.dob,              _fmtDate(marksheet.dob));
    _drawField(CONFIG.fields.courseName,       marksheet.courseName);
    _drawField(CONFIG.fields.courseDuration,   marksheet.courseDuration);
    _drawField(CONFIG.fields.coursePeriodFrom, _fmtDate(marksheet.coursePeriodFrom));
    _drawField(CONFIG.fields.coursePeriodTo,   _fmtDate(marksheet.coursePeriodTo));
    _drawField(CONFIG.fields.instituteName,    marksheet.instituteName);
    _drawField(CONFIG.fields.dateOfIssue,      _fmtDate(marksheet.dateOfIssue));

    const totalPercent = marksheet.percentage != null
      ? marksheet.percentage.toFixed(1) + '%' : '';
    const totalMarks   = marksheet.totalCombinedMarks + '/' + marksheet.maxTotalMarks;
    _drawField(CONFIG.fields.totalPercentage, totalPercent);
    _drawField(CONFIG.fields.overallGrade,    marksheet.overallGrade || '');
    _drawField(CONFIG.fields.grandTotal,      totalMarks);

    const subs           = Array.isArray(marksheet.subjects) ? marksheet.subjects : [];
    const totalTheory    = subs.reduce((s, r) => s + Number(r.theoryMarks    || 0), 0);
    const totalPractical = subs.reduce((s, r) => s + Number(r.practicalMarks || 0), 0);
    const totalObjective = subs.reduce((s, r) => s + Number(r.objectiveMarks || 0), 0);
    const totalCombined  = totalTheory + totalPractical + totalObjective;
    _drawField(CONFIG.fields.theorySum,    String(totalTheory));
    _drawField(CONFIG.fields.practicalSum, String(totalPractical));
    _drawField(CONFIG.fields.objectiveSum, String(totalCombined));

    if (subs.length > 0) {
      const W = _canvas.width, H = _canvas.height;
      const startY    = _pct(CONFIG.fields.subjectsStartY,  H);
      const rowHeight = _pct(CONFIG.fields.subjectRowHeight, H);
      const lineSpacing = _pct(1.5, H);
      let currentY = startY;

      subs.forEach((subject) => {
        _ctx.save();
        _ctx.font      = '100px serif';
        _ctx.fillStyle = '#000000';
        _ctx.textAlign = 'left';
        const maxWidth = _pct(25, W);
        const lines    = _wrapText(subject.subjectName || '-', maxWidth, _ctx);
        lines.forEach((line, i) => {
          _ctx.fillText(line, _pct(10, W), currentY + i * lineSpacing);
        });
        _ctx.restore();

        _ctx.save();
        _ctx.font = '100px serif'; _ctx.fillStyle = '#000000'; _ctx.textAlign = 'center';
        _ctx.fillText(String(subject.theoryMarks || 0),    _pct(55, W), currentY);
        _ctx.restore();

        _ctx.save();
        _ctx.font = '100px serif'; _ctx.fillStyle = '#000000'; _ctx.textAlign = 'center';
        _ctx.fillText(String(subject.practicalMarks || 0), _pct(70, W), currentY);
        _ctx.restore();

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

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  return {

    async loadTemplate(pathOrDataURL) {
      _initCanvas();
      const src = pathOrDataURL || CONFIG.templatePath;

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

    async preview(marksheet) {
      await _render(marksheet);
      return new Promise((resolve, reject) => {
        _canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('toBlob returned null')),
          'image/jpeg', OUTPUT_QUALITY
        );
      });
    },

    async getDataURL(marksheet) {
      await _render(marksheet);
      return _canvas.toDataURL('image/jpeg', OUTPUT_QUALITY);
    },

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

    updateConfig(newConfig) {
      if (newConfig?.fields)       Object.assign(CONFIG.fields, newConfig.fields);
      if (newConfig?.templatePath) CONFIG.templatePath = newConfig.templatePath;
    },

    getConfig() {
      return JSON.parse(JSON.stringify(CONFIG));
    },

    async fetchConfigFromAPI(apiBaseUrl = '/api/settings') {
      console.log('Marksheet: using built-in field positions (API config skipped)');
      return false;
    }
  };
})();

window.MarksheetGenerator = MarksheetGenerator;