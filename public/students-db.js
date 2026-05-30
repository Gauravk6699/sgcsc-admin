// ──────────────────────────────────────────────────────────────────────
// STUDENT DATABASE & LOOKUP — Shared across all generators
// ──────────────────────────────────────────────────────────────────────
// Populate this array with your student records or load from API/backend
//
// Each record supports fields used by the various generators.  Not every
// record needs every field — missing fields fall back gracefully.
//
// Quick add example:
//   StudentDB.add({
//     rollNumber: 'R-2024-001',
//     studentName: 'Ramesh Kumar S/O Suresh Kumar',
//     fatherName: 'Suresh Kumar',
//     motherName: 'Kamla Devi',
//     dob: '2000-01-15',
//     enrollmentNo: 'ENR-2024-001',
//     courseName: 'Diploma in Computer Application',
//     courseDuration: '1 Year',
//     coursePeriodFrom: '2023-04-01',
//     coursePeriodTo: '2024-03-31',
//     ...
//   });
// ──────────────────────────────────────────────────────────────────────

var StudentDB = (() => {
  // Default in-memory store
  let _students = [];

  // Internal helper: normalize strings for loose matching
  function _norm(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Public API
  return {
    // Set entire student list (replace)
    setAll(list) {
      _students = Array.isArray(list) ? list : [];
    },

    // Add a single student record
    add(record) {
      if (record && typeof record === 'object') _students.push(record);
    },

    // Get all students
    getAll() {
      return _students.slice();
    },

    // Find by exact roll number (case-insensitive)
    findByRoll(roll) {
      if (!roll) return null;
      const r = _norm(roll);
      return _students.find(s => _norm(s.rollNumber) === r) || null;
    },

    // Find by roll OR name (loose substring match, returns first)
    find(query) {
      if (!query) return null;
      const q = _norm(query);
      if (!q) return null;
      // Exact roll match first
      const byRoll = this.findByRoll(query);
      if (byRoll) return byRoll;
      // Loose name/roll substring match
      return _students.find(s =>
        _norm(s.rollNumber).includes(q) ||
        _norm(s.studentName).includes(q) ||
        _norm(s.enrollmentNo).includes(q)
      ) || null;
    },

    // Filter by course/criteria (optional helpers)
    filterByCourse(courseName) {
      if (!courseName) return _students.slice();
      const c = _norm(courseName);
      return _students.filter(s => _norm(s.courseName).includes(c));
    }
  };
})();

// ──────────────────────────────────────────────────────────────────────
// AUTO-FILL UI HELPERS
// ──────────────────────────────────────────────────────────────────────
// Creates/manages the student selector UI that can be used by any generator
// on the page.  Call AutoFillUI.init() once.
//
// Usage:
//   AutoFillUI.init();
//   // Then in any generator UI:
//   AutoFillUI.populateStudentSelect(selectElementId, { includeEmpty: true });
// ──────────────────────────────────────────────────────────────────────

var AutoFillUI = (() => {
  let _initialized = false;

  function _createGlobalUI() {
    if (_initialized) return;
    // Create a small floating panel container if not present
    let panel = document.getElementById('student-select-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'student-select-panel';
      panel.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:#fff;padding:8px 12px;border:1px solid #ccc;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,0.15);font-family:sans-serif;font-size:13px;';
      panel.innerHTML = '';
      document.body.appendChild(panel);
    }
    _initialized = true;
  }

  function _createSelect(id, options) {
    let sel = document.getElementById(id);
    if (!sel) {
      sel = document.createElement('select');
      sel.id = id;
      sel.style.cssText = 'padding:4px 8px;font-size:13px;border:1px solid #999;border-radius:4px;min-width:180px;';
      const panel = document.getElementById('student-select-panel');
      if (panel) panel.appendChild(sel);
      else document.body.appendChild(sel);
    }
    // populate
    sel.innerHTML = '';
    if (options.includeEmpty !== false) {
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = options.placeholder || '— Select student —';
      sel.appendChild(emptyOpt);
    }
    const students = StudentDB.getAll();
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.rollNumber || s.enrollmentNo || '';
      opt.textContent = `${s.rollNumber || s.enrollmentNo || '—'} — ${s.studentName || s.applicantName || 'Unnamed'}`;
      opt._studentData = s;
      sel.appendChild(opt);
    });
    return sel;
  }

  return {
    init() {
      _createGlobalUI();
    },

    // Populates a <select> with students. Creates select if not found.
    // options: { includeEmpty: true, placeholder: '...' }
    populateStudentSelect(selectIdOrElement, options = {}) {
      const opts = Object.assign({ includeEmpty: true, placeholder: '— Select student —' }, options);
      let sel;
      if (typeof selectIdOrElement === 'string') {
        sel = document.getElementById(selectIdOrElement);
        sel = _createSelect(selectIdOrElement, opts);
      } else {
        sel = selectIdOrElement;
        // populate existing
        sel.innerHTML = '';
        if (opts.includeEmpty !== false) {
          const emptyOpt = document.createElement('option');
          emptyOpt.value = '';
          emptyOpt.textContent = opts.placeholder;
          sel.appendChild(emptyOpt);
        }
        StudentDB.getAll().forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.rollNumber || s.enrollmentNo || '';
          opt.textContent = `${s.rollNumber || s.enrollmentNo || '—'} — ${s.studentName || s.applicantName || 'Unnamed'}`;
          opt._studentData = s;
          sel.appendChild(opt);
        });
      }
      return sel;
    },

    // Convenience: auto-fill a generator's form inputs from a select
    // generatorName: 'marksheet', 'admitCard', 'certificate', 'idCard', etc.
    // selectId: the <select> element id to watch
    // targetFormSelector: optional selector of form inputs to fill
    bindToSelect(generatorName, selectId, targetFormSelector) {
      const sel = document.getElementById(selectId);
      if (!sel) return;
      sel.addEventListener('change', (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        const s = opt ? opt._studentData : null;
        if (!s) return;

        // Fill common input names across forms
        const mappings = {
          rollNumber: ['rollNumber', 'roll', 'rollNo'],
          studentName: ['studentName', 'name', 'student_name'],
          fatherName: ['fatherName', 'father', 'father_name'],
          motherName: ['motherName', 'mother', 'mother_name'],
          dob: ['dob', 'dateOfBirth', 'date_of_birth'],
          enrollmentNo: ['enrollmentNo', 'enrollment', 'enrollment_number'],
          courseName: ['courseName', 'course', 'course_name', 'program'],
          courseDuration: ['courseDuration', 'duration'],
          coursePeriodFrom: ['coursePeriodFrom', 'sessionFrom', 'fromDate'],
          coursePeriodTo: ['coursePeriodTo', 'sessionTo', 'toDate'],
          address: ['address'],
          mobileNo: ['mobileNo', 'mobile', 'phone'],
          contactNo: ['contactNo', 'contact'],
          certificateNumber: ['certificateNumber', 'certNumber'],
          dateOfIssue: ['dateOfIssue', 'issueDate'],
          atcCode: ['atcCode'],
          grade: ['grade'],
          studyCentre: ['studyCentre', 'center'],
          wordsPerMinute: ['wordsPerMinute', 'wpm'],
          computerTyping: ['computerTyping', 'typing'],
          trainingCentreName: ['trainingCentreName', 'trainingCenter'],
          applicantName: ['applicantName'],
          atcCode2: ['atcCode2'],
          dateOfRenewal: ['dateOfRenewal'],
          photo: ['photo'],
          examCenterAddress: ['examCenterAddress'],
          examDate: ['examDate'],
          examTime: ['examTime'],
          reportingTime: ['reportingTime'],
          examDuration: ['examDuration'],
          theoryMarks: ['theoryMarks', 'theory'],
          practicalMarks: ['practicalMarks', 'practical'],
          objectiveMarks: ['objectiveMarks', 'objective'],
          combinedMarks: ['combinedMarks', 'totalMarks']
        };

        // Find and fill inputs by name/id/class
        Object.keys(mappings).forEach(key => {
          if (s[key] !== undefined) {
            const possibleNames = mappings[key];
            possibleNames.forEach(nm => {
              // try [name]
              let input = targetFormSelector ?
                document.querySelector(`${targetFormSelector} [name="${nm}"]`) :
                document.querySelector(`[name="${nm}"]`);
              // try id
              if (!input) input = document.getElementById(nm);
              // try with underscores/dashes variations
              if (!input) input = document.getElementById(nm.replace(/[-_]/g, ''));
              if (input) {
                input.value = s[key];
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
              }
            });
          }
        });
      });
    },

    // Get student data by roll or query
    getStudent(query) {
      return StudentDB.find(query);
    }
  };
})();

// ──────────────────────────────────────────────────────────────────────
// API FETCHER — Optional: load students from server
// Call: StudentAPI.fetch('/api/students').then(list => StudentDB.setAll(list));
// ──────────────────────────────────────────────────────────────────────

var StudentAPI = {
  fetch(url) {
    return fetch(url).then(r => r.json()).then(data => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.students)) return data.students;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    }).catch(err => {
      console.warn('Failed to fetch students:', err);
      return [];
    });
  },

  // Fetch and auto-populate DB
  load(url) {
    return this.fetch(url).then(list => {
      StudentDB.setAll(list);
      console.log('Student DB loaded with', list.length, 'records');
      // Auto-init UI if page has the panel
      if (document.getElementById('student-select-panel')) {
        AutoFillUI.init();
      }
      return list;
    });
  }
};

// Expose globally
window.StudentDB = StudentDB;
window.AutoFillUI = AutoFillUI;
window.StudentAPI = StudentAPI;