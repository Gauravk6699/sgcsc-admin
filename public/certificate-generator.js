// ╔══════════════════════════════════════════════════════════════╗
// ║           CERTIFICATE GENERATOR — DROP-IN MODULE            ║
// ║                                                              ║
// ║  SETUP (do once):                                            ║
// ║    CertificateGenerator.loadTemplate('path/to/template.jpg') ║
// ║                                                              ║
// ║  GENERATE (call whenever you have student data):             ║
// ║    CertificateGenerator.download({ ...studentData })         ║
// ║    CertificateGenerator.preview({ ...studentData }) ← blob  ║
// ║    CertificateGenerator.downloadAll([ ...students ])         ║
// ╚══════════════════════════════════════════════════════════════╝

var CertificateGenerator = (() => {

    const CONFIG = {
      templatePath: 'student-certificate-template.jpeg',

       fields: {
         photo:                { x: 41.5,  y: 30.7, width: 16, height: 13 },
         centerName:           { x: 18,  y: 52.7, font: '160px serif', color: '#000000', align: 'left' },
         studentNameCombined:  { x: 50,  y: 49,  font: '160px serif', color: '#000000', align: 'center' },
         courseName:           { x: 50,  y: 58.5, font: '160px serif', color: '#000000', align: 'center' },
         grade:                { x: 56.5, y: 55.5, font: '160px serif', color: '#000000', align: 'left' },
         gradeExtra:           { x: 80,  y: 76.3, font: '160px serif', color: '#000000', align: 'left' },
         courseDuration:       { x: 54,  y: 61.5, font: '160px serif', color: '#000000', align: 'left' },
         coursePeriodFrom:     { x: 41.5, y: 64.3, font: '160px serif', color: '#000000', align: 'left' },
         coursePeriodTo:       { x: 61,  y: 64.3, font: '160px serif', color: '#000000', align: 'left' },
         certificateNumber:    { x: 23,  y: 93,  font: '160px serif', color: '#000000', align: 'left' },
         dateOfIssue:          { x: 55,  y: 93,  font: '160px serif', color: '#000000', align: 'left' },
         qrCode:               { x: 19.7,  y: 85.8, width: 12.5, height: 11.5 }
       }
    };

   let _templateImg = null;
   let _templateDPI = 300;
   let _canvas = null;
   let _ctx = null;

   function _initCanvas() {
     if (!_canvas) {
       _canvas = document.getElementById('certCanvas');
       if (!_canvas) {
         _canvas = document.createElement('canvas');
         _canvas.id = 'certCanvas';
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
       const timer = setTimeout(() => {
         img.src = '';
         reject(new Error(`Image load timeout after ${timeout}ms: ${src}`));
       }, timeout);
       img.onload  = () => { clearTimeout(timer); resolve(img); };
       img.onerror = () => { clearTimeout(timer); reject(new Error('Failed to load image: ' + src)); };
       img.src = src;
     });
   }

   function _drawQRCode(qrData) {
     if (!qrData || !_ctx) return;
     const qrField = CONFIG.fields.qrCode;
     if (!qrField) return;
     const W = _canvas.width, H = _canvas.height;
     const size = Math.min(_pct(qrField.width, W), _pct(qrField.height, H));
     const x = _pct(qrField.x, W) - size/2;
     const y = _pct(qrField.y, H) - size/2;
     try {
       const qr = new QRious({ value: qrData, size: size, background: 'white', foreground: 'black' });
       _ctx.drawImage(qr.toImage(), x, y, size, size);
     } catch (e) {
       console.warn('Could not generate QR code:', e.message);
       _ctx.save();
       _ctx.strokeStyle = '#000000';
       _ctx.lineWidth = 2;
       _ctx.strokeRect(x, y, size, size);
       _ctx.font = '16px serif';
       _ctx.fillStyle = '#000000';
       _ctx.textAlign = 'center';
       _ctx.fillText('QR', x + size/2, y + size/2 + 5);
       _ctx.restore();
     }
   }

   function _drawField(field, text) {
     if (!text || !_ctx) return;
     const W = _canvas.width, H = _canvas.height;
     _ctx.save();
     let fontSize = field.font;
     if (typeof field.font === 'string' && field.font.includes('%')) {
       const percent = parseFloat(field.font.replace('%', ''));
       fontSize = Math.floor((percent / 100) * H) + 'px serif';
     }
     _ctx.font      = fontSize;
     _ctx.fillStyle = field.color;
     _ctx.textAlign = field.align || 'left';
     _ctx.fillText(text, _pct(field.x, W), _pct(field.y, H));
     _ctx.restore();
   }

   function _drawPhoto(img) {
     if (!img || !_ctx) return;
     const photoField = CONFIG.fields.photo;
     if (!photoField) return;
     const W = _canvas.width, H = _canvas.height;
     const x = _pct(photoField.x, W);
     const y = _pct(photoField.y, H);
     const w = _pct(photoField.width, W);
     const h = _pct(photoField.height, H);
     _ctx.save();
     _ctx.beginPath();
     _ctx.rect(x, y, w, h);
     _ctx.clip();
     _ctx.drawImage(img, x, y, w, h);
     _ctx.restore();
   }

   // ── Read DPI from JPEG JFIF / EXIF metadata ──────────────────────────────
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
             const readU16   = (o) => littleEnd ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8))
                                                : ((bytes[tiffStart+o]<<8) | bytes[tiffStart+o+1]);
             const readU32   = (o) => littleEnd ? (bytes[tiffStart+o] | (bytes[tiffStart+o+1]<<8)
                                                  | (bytes[tiffStart+o+2]<<16) | (bytes[tiffStart+o+3]<<24))
                                                : ((bytes[tiffStart+o]<<24) | (bytes[tiffStart+o+1]<<16)
                                                  | (bytes[tiffStart+o+2]<<8) | bytes[tiffStart+o+3]);
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

   async function _render(studentOrRoll) {
     const student = _resolveStudentData(studentOrRoll);
     if (!_templateImg) {
       console.warn('Template not loaded, creating fallback background');
       if (!_initCanvas()) throw new Error('Canvas not found.');
       _canvas.width = 1417;
       _canvas.height = 2000;
       _ctx.fillStyle = '#FFFFFF';
       _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
       _ctx.fillStyle = '#000000';
       _ctx.font = '48px serif';
       _ctx.textAlign = 'center';
       _ctx.fillText('CERTIFICATE', _canvas.width / 2, 100);
     } else {
       if (!_templateImg.complete || _templateImg.naturalWidth === 0)
         throw new Error('Template image not fully loaded or corrupted');
     }

     if (!_initCanvas()) throw new Error('Canvas not found. Make sure <canvas id="certCanvas"> exists.');

     _canvas.width  = _templateImg.naturalWidth;
     _canvas.height = _templateImg.naturalHeight;
     _ctx.imageSmoothingEnabled = true;
     _ctx.imageSmoothingQuality = 'high';
     _ctx.drawImage(_templateImg, 0, 0);

     if (student.photo) {
       try {
         const photoImg = await _loadImage(student.photo, 5000);
         if (photoImg) _drawPhoto(photoImg);
       } catch (e) {
         console.warn('Could not load student photo (continuing without photo):', e.message);
       }
     }

     let qrData = student.qrData;
     if (qrData === undefined) {
       qrData = `CERTNO:${student.certificateNumber || ''}|NAME:${student.studentNameCombined || ''}|COURSE:${student.courseName || ''}`;
     }
     if (qrData) _drawQRCode(qrData);

     _drawField(CONFIG.fields.centerName,          student.centerName);
     _drawField(CONFIG.fields.studentNameCombined, student.studentNameCombined);
     _drawField(CONFIG.fields.courseName,          student.courseName);
     _drawField(CONFIG.fields.grade,               student.grade);
     _drawField(CONFIG.fields.gradeExtra,          student.grade);
     _drawField(CONFIG.fields.courseDuration,      (student.courseDuration || '').toUpperCase());
     _drawField(CONFIG.fields.coursePeriodFrom,    student.coursePeriodFrom ? _fmtDate(student.coursePeriodFrom) : '');
     _drawField(CONFIG.fields.coursePeriodTo,      student.coursePeriodTo  ? _fmtDate(student.coursePeriodTo)  : '');
     _drawField(CONFIG.fields.certificateNumber,   student.certificateNumber);
     _drawField(CONFIG.fields.dateOfIssue,         _fmtDate(student.dateOfIssue));

     return _canvas;
   }

   // ── PDF generation — lossless PNG embed + correct DPI sizing + zoom fix ──
   function _canvasToPDF() {
     const { jsPDF } = window.jspdf;
     const W = _canvas.width, H = _canvas.height;

     // Always use A4 as the PDF page size.
     // Chrome's built-in viewer opens standard paper sizes at a sensible zoom.
     // A custom giant page (e.g. 762mm x 1079mm from raw pixel dimensions)
     // causes Chrome to open at ~16% zoom with no easy way to zoom back in.
     const isLandscape = W > H;
     const pageW = isLandscape ? 297 : 210;  // A4 in mm
     const pageH = isLandscape ? 210 : 297;

     const pdf = new jsPDF({
       orientation: isLandscape ? 'landscape' : 'portrait',
       unit: 'mm',
       format: 'a4'
     });

     // Lossless PNG embed stretched to fill A4 exactly
     const imgData = _canvas.toDataURL('image/png');
     pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
     return pdf;
   }

   function _safeName(name) {
     return (name || 'certificate').replace(/[^a-z0-9_\-]/gi, '_');
   }

   function _resolveStudentData(studentOrRoll) {
     if (typeof studentOrRoll === 'string') {
       if (typeof window !== 'undefined' && window.StudentDB) {
         const found = window.StudentDB.find(studentOrRoll);
         if (found) {
           return {
             centerName: found.centerName || found.center || '',
             studentNameCombined: found.studentName || found.applicantName || '',
             courseName: found.courseName || '',
             grade: found.grade || '',
             courseDuration: found.courseDuration || '',
             coursePeriodFrom: found.coursePeriodFrom || '',
             coursePeriodTo: found.coursePeriodTo || '',
             certificateNumber: found.certificateNumber || '',
             dateOfIssue: found.dateOfIssue || '',
             photo: found.photo || ''
           };
         }
         console.warn('No student found with lookup:', studentOrRoll);
         return { studentNameCombined: studentOrRoll };
       }
       console.warn('StudentDB not available');
       return { studentNameCombined: studentOrRoll };
     }
     return studentOrRoll || {};
   }

   // ─────────────────────────────────────────────
   // PUBLIC API
   // ─────────────────────────────────────────────
   return {

     async loadTemplate(pathOrDataURL, timeout = 5000) {
       _initCanvas();
       const src = pathOrDataURL || CONFIG.templatePath;

       // Read DPI from JPEG metadata for correct PDF sizing
       if (!src.startsWith('data:')) {
         const dpi = await _readJpegDPI(src);
         _templateDPI = (dpi && dpi > 0) ? dpi : 300;
         console.log(`Template DPI: ${_templateDPI}`);
       }

       return new Promise((resolve) => {
         const img = new Image();
         img.crossOrigin = 'anonymous';
         const timer = setTimeout(() => {
           img.src = '';
           console.warn('Template load timeout');
           _templateImg = null;
           resolve(null);
         }, timeout);
         img.onload = () => {
           clearTimeout(timer);
           console.log('Template loaded:', img.naturalWidth, 'x', img.naturalHeight);
           _templateImg = img;
           resolve(img);
         };
         img.onerror = () => {
           clearTimeout(timer);
           console.warn('Failed to load template, will use fallback background');
           _templateImg = null;
           resolve(null);
         };
         img.src = src;
       });
     },

     async preview(studentOrRoll) {
       await _render(studentOrRoll);
       return _canvas.toDataURL('image/png');
     },

     async getPreviewURL(studentOrRoll) {
       return this.preview(studentOrRoll);
     },

     async getDataURL(student, quality = 0.6) {
       await _render(student);
       return _canvas.toDataURL('image/jpeg', quality);
     },

     async getCompressedDataURL(student) {
       return this.getDataURL(student, 0.4);
     },

     async download(studentOrRoll) {
       try {
         await _render(studentOrRoll);
         const student = _resolveStudentData(studentOrRoll);
         _canvasToPDF().save(`student_certificate_${_safeName(student.studentNameCombined)}.pdf`);
       } catch (err) {
         console.error('CertificateGenerator.download error:', err);
         alert('Failed to generate PDF: ' + err.message);
       }
     },

     async downloadAll(students, onProgress) {
       if (!Array.isArray(students) || students.length === 0) {
         console.warn('No students to download');
         return;
       }
       for (let i = 0; i < students.length; i++) {
         await this.download(students[i]);
         if (onProgress) onProgress(i + 1, students.length);
         await new Promise(r => setTimeout(r, 350));
       }
     },

     setField(fieldName, overrides) {
       if (!CONFIG.fields[fieldName]) throw new Error('Unknown field: ' + fieldName);
       Object.assign(CONFIG.fields[fieldName], overrides);
     },

     updateFieldPositions(newFields) {
       if (newFields && typeof newFields === 'object') {
         Object.assign(CONFIG.fields, newFields);
       }
     },

     updateConfig(newConfig) {
       if (newConfig && newConfig.fields) this.updateFieldPositions(newConfig.fields);
     },

     async fetchConfigFromAPI(apiBaseUrl = '/api/settings') {
       try {
         const response = await fetch(`${apiBaseUrl}/certificate-template`);
         const data = await response.json();
         if (data.success && data.data && data.data.studentCertificate) {
           CONFIG.fields = { ...CONFIG.fields, ...data.data.studentCertificate };
           return true;
         }
       } catch (err) {
         console.warn('Failed to fetch template config from API:', err);
       }
       return false;
     },

     get config() { return CONFIG; }
   };

})();

window.CertificateGenerator = CertificateGenerator;