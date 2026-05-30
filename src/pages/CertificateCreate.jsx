// src/pages/CertificateCreate.jsx
import { useState, useEffect, useRef } from 'react';
import API, { getCourses } from "../api/api";

// Certificate Generator Global Reference
let certificateGenerator = null;

// Helper function to calculate duration between two dates in "X years Y months" format
function calculateDuration(fromDate, toDate) {
  if (!fromDate || !toDate) return '';

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) return '';

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  // If to date is before from date in the same year
  if (to < from) {
    years--;
    months += 12;
  }

  // Build the duration string
  const parts = [];
  if (years > 0) {
    parts.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months > 1 ? 's' : ''}`);
  }

  return parts.join(' ') || '0 months';
}

export default function CertificateCreate() {
  // Form fields
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [sessionFrom, setSessionFrom] = useState('');
  const [sessionTo, setSessionTo] = useState('');
  const [grade, setGrade] = useState('');
  const [courseDuration, setCourseDuration] = useState('');
  const [coursePeriodFrom, setCoursePeriodFrom] = useState('');
  const [coursePeriodTo, setCoursePeriodTo] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [centerName, setCenterName] = useState('');
  const [atcName, setAtcName] = useState('');

  // State management
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'success' | 'danger' | 'info'

  // Certificate preview state
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState('');
  const canvasRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  // Initialize Certificate Generator function
  const initCertificateGenerator = async () => {
    if (certificateGenerator) return certificateGenerator;

    // Ensure DOM is ready
    if (document.readyState !== 'complete') {
      console.log('Waiting for DOM to be ready...');
      await new Promise(resolve => {
        const checkReady = () => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }

    // Ensure canvas is available before loading template
    let canvasElement = document.getElementById('certCanvas');
    if (!canvasElement) {
      console.warn('Canvas element not found in DOM. Creating it...');
      canvasElement = document.createElement('canvas');
      canvasElement.id = 'certCanvas';
      canvasElement.style.display = 'none';
      document.body.appendChild(canvasElement);
    }
    
    // Wait for certificate generator script to load if not available yet
    console.log('Checking for CertificateGenerator, current:', typeof window.CertificateGenerator);
    if (!window.CertificateGenerator) {
      console.log('CertificateGenerator not found, checking if script is loaded...');
      const existingScript = document.querySelector('script[src*="certificate-generator.js"]');
      console.log('Existing script tag:', existingScript);
      if (existingScript) {
        console.log('Script tag exists, waiting for it to execute...');
        await new Promise((resolve, reject) => {
          const checkLoaded = () => {
            console.log('Checking again, CertificateGenerator:', typeof window.CertificateGenerator);
            if (window.CertificateGenerator) {
              console.log('CertificateGenerator found!');
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          setTimeout(() => {
            console.log('Timeout reached, CertificateGenerator still not found');
            reject(new Error('CertificateGenerator script failed to load'));
          }, 15000);
          checkLoaded();
        });
      } else {
        console.log('Loading CertificateGenerator script dynamically...');
        // Script not loaded yet, dynamically load it
        return new Promise((resolve) => {
          // Load jspdf if not present
          if (!window.jspdf) {
            const jspdfScript = document.createElement('script');
            jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jspdfScript.onload = () => {
              // Load certificate-generator
              const certScript = document.createElement('script');
              certScript.src = '/certificate-generator.js';
              certScript.onload = async () => {
                if (window.CertificateGenerator) {
                  certificateGenerator = window.CertificateGenerator;
                  try {
                    await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
                    console.log('Certificate template loaded successfully');
                  } catch (err) {
                    console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
                  }
                }
                resolve(certificateGenerator);
              };
              document.body.appendChild(certScript);
            };
            document.body.appendChild(jspdfScript);
          } else if (!window.CertificateGenerator) {
            // jspdf loaded but certificate-generator not loaded
            const certScript = document.createElement('script');
            certScript.src = '/certificate-generator.js';
            certScript.onload = async () => {
              if (window.CertificateGenerator) {
                certificateGenerator = window.CertificateGenerator;
                try {
                  await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
                  console.log('Certificate template loaded successfully');
                } catch (err) {
                  console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
                }
              }
              resolve(certificateGenerator);
            };
            document.body.appendChild(certScript);
          } else {
            resolve(window.CertificateGenerator);
          }
        });
      }
    }

    // Check if available on window
    if (window.CertificateGenerator) {
      certificateGenerator = window.CertificateGenerator;
      try {
        console.log('Loading certificate template...');
        await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
        console.log('Certificate template loaded successfully');
        return certificateGenerator;
      } catch (err) {
        console.error('Failed to load certificate template:', err.message);
        console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
        // Generator can still work with fallback, so don't set to null
        console.log('Continuing with fallback certificate background');
      }
    }
    
    // Script not loaded yet, dynamically load it
    return new Promise((resolve) => {
      // Load jspdf if not present
      if (!window.jspdf) {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.onload = () => {
          // Load certificate-generator
          const certScript = document.createElement('script');
          certScript.src = '/certificate-generator.js';
          certScript.onload = async () => {
            if (window.CertificateGenerator) {
              certificateGenerator = window.CertificateGenerator;
              try {
                await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
                console.log('Certificate template loaded successfully');
              } catch (err) {
                console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
              }
            }
            resolve(certificateGenerator);
          };
          document.body.appendChild(certScript);
        };
        document.body.appendChild(jspdfScript);
      } else if (!window.CertificateGenerator) {
        // jspdf loaded but certificate-generator not loaded
        const certScript = document.createElement('script');
        certScript.src = '/certificate-generator.js';
        certScript.onload = async () => {
          if (window.CertificateGenerator) {
            certificateGenerator = window.CertificateGenerator;
            try {
              await certificateGenerator.loadTemplate('/student-certificate-template.jpeg');
              console.log('Certificate template loaded successfully');
            } catch (err) {
              console.warn('Certificate template not found. Please upload a template to /public/student-certificate-template.jpeg');
            }
          }
          resolve(certificateGenerator);
        };
        document.body.appendChild(certScript);
      }
    });
  };



  // Fetch courses and students on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch courses
        const coursesData = await getCourses();
        setCourses(coursesData);

        // Fetch all students
        const studentsRes = await API.get('/students');
        const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : Array.isArray(studentsRes.data?.data) ? studentsRes.data.data : [];
        setAllStudents(studentsData);
        setFilteredStudents(studentsData);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };

    fetchInitialData();

    // Try to initialize certificate generator on mount
    initCertificateGenerator();
  }, []);

  // Auto-calculate course duration when period dates change
  useEffect(() => {
    if (coursePeriodFrom && coursePeriodTo) {
      const duration = calculateDuration(coursePeriodFrom, coursePeriodTo);
      setCourseDuration(duration);
    } else {
      setCourseDuration('');
    }
  }, [coursePeriodFrom, coursePeriodTo]);

  // Handle student selection - filter courses for this student
  const handleStudentSelection = (selectedEnrollmentNumber) => {
    setEnrollmentNumber(selectedEnrollmentNumber);
    setCourseName(''); // Reset course selection

    // Find the selected student
    const selectedStudent = allStudents.find(student =>
      (student.enrollmentNumber || student.rollNumber) === selectedEnrollmentNumber
    );

    if (selectedStudent) {
      console.log('Selected student data:', selectedStudent);
      // Filter courses that this student is enrolled in
      if (selectedStudent.courses && Array.isArray(selectedStudent.courses)) {
        const studentCourses = selectedStudent.courses.map(c => ({
          _id: c._id,
          name: c.courseName
        }));
        setFilteredCourses(studentCourses);
      } else if (selectedStudent.courseName) {
        // Fallback for single course
        const studentCourse = courses.find(c => c.name === selectedStudent.courseName);
        setFilteredCourses(studentCourse ? [studentCourse] : []);
      } else {
        setFilteredCourses([]);
      }

      // Auto-fill basic student details
      setName(selectedStudent.name || '');
      setFatherName(selectedStudent.fatherName || '');
      setCenterName(selectedStudent.centerName || '');
      setAtcName(selectedStudent.centerName || '');

      setMessageType('info');
      setMessage(`Student selected. Now choose a course to auto-fill details.`);
    }
  };

  // Handle course selection - auto-fill details
  const handleCourseSelection = async (selectedCourseName) => {
    setCourseName(selectedCourseName);

    // Find the selected student
    const selectedStudent = allStudents.find(student =>
      (student.enrollmentNumber || student.rollNumber) === enrollmentNumber
    );

    if (selectedStudent && selectedCourseName) {
      try {
        // Fetch marksheet for this student and course to get the grade from marksheet
        const marksheetRes = await API.get('/marksheets');
        const allMarksheets = Array.isArray(marksheetRes.data) ? marksheetRes.data : Array.isArray(marksheetRes.data?.data) ? marksheetRes.data.data : [];

        // Find marksheet for this student and course
        const studentMarksheet = allMarksheets.find(marksheet =>
          marksheet.enrollmentNo === enrollmentNumber && marksheet.courseName === selectedCourseName
        );

        // Find the course details for this student
        let courseDetails = null;
        if (selectedStudent.courses && Array.isArray(selectedStudent.courses)) {
          courseDetails = selectedStudent.courses.find(c => c.courseName === selectedCourseName);
        }

        if (courseDetails) {
          // Auto-fill student details
          setName(selectedStudent.name || '');
          setFatherName(selectedStudent.fatherName || '');

          // Set session from course details
          if (courseDetails.sessionStart) {
            const startYear = new Date(courseDetails.sessionStart).getFullYear();
            setSessionFrom(startYear.toString());
          }
          if (courseDetails.sessionEnd) {
            const endYear = new Date(courseDetails.sessionEnd).getFullYear();
            setSessionTo(endYear.toString());
          }

          // Set course period dates first (duration will be auto-calculated from dates)
          if (courseDetails.sessionStart) {
            setCoursePeriodFrom(courseDetails.sessionStart.split('T')[0]); // Format as YYYY-MM-DD
          }
          if (courseDetails.sessionEnd) {
            setCoursePeriodTo(courseDetails.sessionEnd.split('T')[0]); // Format as YYYY-MM-DD
          }

          // Note: Course duration will be auto-calculated from the dates above
        } else {
          // Fallback to student-level course data
          setName(selectedStudent.name || '');
          setFatherName(selectedStudent.fatherName || '');

          if (selectedStudent.sessionStart) {
            const startYear = new Date(selectedStudent.sessionStart).getFullYear();
            setSessionFrom(startYear.toString());
          }
          if (selectedStudent.sessionEnd) {
            const endYear = new Date(selectedStudent.sessionEnd).getFullYear();
            setSessionTo(endYear.toString());
          }
        }

        // Set grade from marksheet if available, otherwise fallback to student record
        console.log('Setting grade - marksheet:', studentMarksheet, 'student grade:', selectedStudent.grade);
        if (studentMarksheet && (studentMarksheet.overallGrade || studentMarksheet.grade)) {
          setGrade(studentMarksheet.overallGrade || studentMarksheet.grade);
        } else {
          setGrade(selectedStudent.grade || '');
        }
        console.log('Grade set to:', studentMarksheet?.overallGrade || selectedStudent.grade || '');

        // Store student photo
        setStudentPhoto(selectedStudent.photo || '');

        setMessageType('success');
        setMessage('Student and course details auto-filled successfully!');
      } catch (err) {
        console.error('Error fetching marksheet for grade:', err);
        // Fallback to existing logic without marksheet
        // Find the course details for this student
        let courseDetails = null;
        if (selectedStudent.courses && Array.isArray(selectedStudent.courses)) {
          courseDetails = selectedStudent.courses.find(c => c.courseName === selectedCourseName);
        }

        if (courseDetails) {
          // Auto-fill student details
          setName(selectedStudent.name || '');
          setFatherName(selectedStudent.fatherName || '');

          // Set session from course details
          if (courseDetails.sessionStart) {
            const startYear = new Date(courseDetails.sessionStart).getFullYear();
            setSessionFrom(startYear.toString());
          }
          if (courseDetails.sessionEnd) {
            const endYear = new Date(courseDetails.sessionEnd).getFullYear();
            setSessionTo(endYear.toString());
          }

          // Set course period dates first (duration will be auto-calculated from dates)
          if (courseDetails.sessionStart) {
            setCoursePeriodFrom(courseDetails.sessionStart.split('T')[0]); // Format as YYYY-MM-DD
          }
          if (courseDetails.sessionEnd) {
            setCoursePeriodTo(courseDetails.sessionEnd.split('T')[0]); // Format as YYYY-MM-DD
          }

          // Note: Course duration will be auto-calculated from the dates above
        } else {
          // Fallback to student-level course data
          setName(selectedStudent.name || '');
          setFatherName(selectedStudent.fatherName || '');

          if (selectedStudent.sessionStart) {
            const startYear = new Date(selectedStudent.sessionStart).getFullYear();
            setSessionFrom(startYear.toString());
          }
          if (selectedStudent.sessionEnd) {
            const endYear = new Date(selectedStudent.sessionEnd).getFullYear();
            setSessionTo(endYear.toString());
          }
        }

        // Set grade from student record since marksheet fetch failed
        setGrade(selectedStudent.grade || '');

        // Store student photo
        setStudentPhoto(selectedStudent.photo || '');

        setMessageType('success');
        setMessage('Student and course details auto-filled successfully!');
      }
    }
  };



  const validate = () => {
    if (!enrollmentNumber.trim()) {
      setMessageType('danger');
      setMessage('Student selection is required.');
      return false;
    }
    if (!courseName.trim()) {
      setMessageType('danger');
      setMessage('Course Name is required.');
      return false;
    }
    if (!name.trim()) {
      setMessageType('danger');
      setMessage('Name is required.');
      return false;
    }
    if (!fatherName.trim()) {
      setMessageType('danger');
      setMessage("Parent's Name is required.");
      return false;
    }
    if (!courseName.trim()) {
      setMessageType('danger');
      setMessage('Course Name is required.');
      return false;
    }
    if (!sessionFrom) {
      setMessageType('danger');
      setMessage('Session From is required.');
      return false;
    }
    if (!sessionTo) {
      setMessageType('danger');
      setMessage('Session To is required.');
      return false;
    }
    if (!grade.trim()) {
      setMessageType('danger');
      setMessage('Grade is required.');
      return false;
    }
    if (!courseDuration.trim()) {
      setMessageType('danger');
      setMessage('Course Duration is required.');
      return false;
    }
    if (!coursePeriodFrom) {
      setMessageType('danger');
      setMessage('Course Period From is required.');
      return false;
    }
    if (!coursePeriodTo) {
      setMessageType('danger');
      setMessage('Course Period To is required.');
      return false;
    }
    if (!certificateNumber.trim()) {
      setMessageType('danger');
      setMessage('Certificate Number is required.');
      return false;
    }
    if (!issueDate) {
      setMessageType('danger');
      setMessage('Issue Date is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validate()) return;

    // Initialize generator if not already done
    if (!certificateGenerator) {
      setMessage('Loading certificate generator...');
      setMessageType('info');
      await initCertificateGenerator();
      
      if (!certificateGenerator) {
        setMessageType('danger');
        setMessage('Failed to load certificate generator. Please check console for details.');
        setSaving(false);
        return;
      }
    }

    setSaving(true);
    try {
      // Generate certificate image data URL for storing
      let certificateImage = null;
      if (certificateGenerator && certificateGenerator.getCompressedDataURL) {
        try {
          const studentNameCombined = `${name.trim()} S/O, D/O, W/O ${fatherName.trim()}`;
          const studentData = {
            centerName: centerName || "SGCSC Training Center",
            studentNameCombined: studentNameCombined,
            courseName: courseName.trim(),
            grade: grade.trim(),
            courseDuration: courseDuration.trim(),
            coursePeriodFrom: coursePeriodFrom,
            coursePeriodTo: coursePeriodTo,
            certificateNumber: certificateNumber.trim(),
            dateOfIssue: issueDate,
            photo: studentPhoto
          };
          console.log('Generating certificate with data:', studentData);

          certificateImage = await certificateGenerator.getCompressedDataURL(studentData);

          console.log('Certificate image generated successfully, length:', certificateImage ? certificateImage.length : 0);
        } catch (imgErr) {
          console.error('Failed to generate certificate image:', imgErr);
          // Continue without image - certificate can still be created
          console.log('Certificate will be created without image data');
          certificateImage = null;
        }
      } else {
        console.warn('Certificate generator not available');
      }

      const payload = {
        name: name.trim(),
        fatherName: fatherName.trim(),
        courseName: courseName.trim(),
        sessionFrom: parseInt(sessionFrom),
        sessionTo: parseInt(sessionTo),
        grade: grade.trim(),
        courseDuration: courseDuration.trim(),
        coursePeriodFrom: coursePeriodFrom,
        coursePeriodTo: coursePeriodTo,
        enrollmentNumber: enrollmentNumber.trim(),
        certificateNumber: certificateNumber.trim(),
        issueDate,
        certificateImage,
      };

      await API.post('/certificates', payload);

      setMessageType('success');
      setMessage('Certificate created successfully.');

      // reset form
      setEnrollmentNumber('');
      setName('');
      setFatherName('');
      setCenterName('');
      setAtcName('');
      setCourseName('');
      setSessionFrom('');
      setSessionTo('');
      setGrade('');
      setCourseDuration('');
      setCoursePeriodFrom('');
      setCoursePeriodTo('');
      setCertificateNumber('');
      setIssueDate('');
      setPreviewUrl(null);
    } catch (err) {
      console.error('create certificate error:', err);
      setMessageType('danger');
      setMessage(err.userMessage || 'Failed to create certificate');
    } finally {
      setSaving(false);
    }
  };

  // Handle Preview Certificate
  const handlePreview = async () => {
    if (!validate()) return;
    
    // Initialize generator if not already done
    if (!certificateGenerator) {
      setMessage('Loading certificate generator...');
      setMessageType('info');
      await initCertificateGenerator();
      
      if (!certificateGenerator) {
        setMessageType('danger');
        setMessage('Failed to load certificate generator. Please check console for details.');
        return;
      }
    }
    
    setLoadingPreview(true);
    try {
      // Combine name with all relations (S/O, D/O, W/O) and parent's name in a single line
      const studentNameCombined = `${name.trim()} S/O, D/O, W/O ${fatherName.trim()}`;
      
      const studentData = {
        atcCode: certificateNumber.trim(),
        studentNameCombined: studentNameCombined,
        courseName: courseName.trim(),
        grade: grade.trim(),
        courseDuration: courseDuration.trim(),
        coursePeriodFrom: coursePeriodFrom,
        coursePeriodTo: coursePeriodTo,
        certificateNumber: certificateNumber.trim(),
        dateOfIssue: issueDate,
        photo: studentPhoto
      };
      
      const url = await certificateGenerator.getPreviewURL(studentData);
      setPreviewUrl(url);
      setMessageType('success');
      setMessage('Certificate preview generated!');
    } catch (err) {
      console.error('Preview error:', err);
      setMessageType('danger');
      setMessage('Failed to generate preview. Make sure template is uploaded.');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle Download Certificate
  const handleDownload = async () => {
    if (!validate()) return;
    
    // Initialize generator if not already done
    if (!certificateGenerator) {
      setMessage('Loading certificate generator...');
      setMessageType('info');
      await initCertificateGenerator();
      
      if (!certificateGenerator) {
        setMessageType('danger');
        setMessage('Failed to load certificate generator. Please check console for details.');
        return;
      }
    }
    
    try {
      // Combine name with all relations (S/O, D/O, W/O) and parent's name in a single line
      const studentNameCombined = `${name.trim()} S/O, D/O, W/O ${fatherName.trim()}`;
      
      const studentData = {
        atcCode: certificateNumber.trim(),
        studentNameCombined: studentNameCombined,
        courseName: courseName.trim(),
        grade: grade.trim(),
        courseDuration: courseDuration.trim(),
        coursePeriodFrom: coursePeriodFrom,
        coursePeriodTo: coursePeriodTo,
        certificateNumber: certificateNumber.trim(),
        dateOfIssue: issueDate,
        photo: studentPhoto
      };
      
      certificateGenerator.download(studentData);
      setMessageType('success');
      setMessage('Certificate download started!');
    } catch (err) {
      console.error('Download error:', err);
      setMessageType('danger');
      setMessage('Failed to download certificate. Make sure template is uploaded.');
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <div className="flex-grow-1">
        <div className="container-fluid p-4">
          <h2 className="mb-4 fw-bold">Student Certificate Generation</h2>

          {message && (
            <div
              className={`alert alert-${
                messageType === 'danger'
                  ? 'danger'
                  : messageType === 'success'
                  ? 'success'
                  : 'info'
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="row g-3">
                {/* Student Selection - First field */}
                <div className="col-md-6">
                  <label className="form-label">Student *</label>
                  <select
                    className="form-select"
                    value={enrollmentNumber}
                    onChange={(e) => handleStudentSelection(e.target.value)}
                    required
                  >
                    <option value="">Select Student</option>
                    {filteredStudents.map((student) => (
                      <option key={student._id || student.enrollmentNumber} value={student.enrollmentNumber || student.rollNumber}>
                        {student.name} ({student.enrollmentNumber || student.rollNumber})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Select a student to filter available courses
                  </small>
                </div>

                {/* Course Name - Second field */}
                <div className="col-md-6">
                  <label className="form-label">Course Name *</label>
                  <select
                    className="form-select"
                    value={courseName}
                    onChange={(e) => handleCourseSelection(e.target.value)}
                    required
                    disabled={!enrollmentNumber}
                  >
                    <option value="">Select Course</option>
                    {filteredCourses.map((course) => (
                      <option key={course._id} value={course.name}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Courses available for the selected student ({filteredCourses.length} found)
                  </small>
                </div>

                {/* Center Name - New field */}
                <div className="col-md-6">
                  <label className="form-label">Center Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="Center Name"
                  />
                </div>

                {/* ATC Name - New field */}
                <div className="col-md-6">
                  <label className="form-label">ATC Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={atcName}
                    onChange={(e) => setAtcName(e.target.value)}
                    placeholder="ATC Name"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Parent's Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Session From *</label>
                  <select
                    className="form-select"
                    value={sessionFrom}
                    onChange={(e) => setSessionFrom(e.target.value)}
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Session To *</label>
                  <select
                    className="form-select"
                    value={sessionTo}
                    onChange={(e) => setSessionTo(e.target.value)}
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Grade *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., A, A+, First Division"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Duration *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={courseDuration}
                    readOnly
                    placeholder="Auto-calculated from period dates"
                    required
                  />
                  <small className="text-muted">
                    Calculated automatically from Course Period From and To dates
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Period From *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={coursePeriodFrom}
                    onChange={(e) => setCoursePeriodFrom(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course Period To *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={coursePeriodTo}
                    onChange={(e) => setCoursePeriodTo(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Certificate Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Issue Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Create Certificate'}
                  </button>
                </div>

                {/* Certificate Preview and Download Buttons */}
                <div className="col-12 mt-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title mb-3">Certificate Preview & Download</h5>
                      <p className="text-muted small mb-3">
                        Fill all fields above, then click Preview to see or Download to save the certificate.
                        <br />
                        <span className="text-warning">Note: Upload a student-certificate-template.jpeg to /public folder for this feature to work.</span>
                      </p>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={handlePreview}
                          disabled={loadingPreview || !name || !fatherName || !courseName || !grade || !courseDuration || !coursePeriodFrom || !coursePeriodTo || !certificateNumber || !issueDate}
                        >
                          {loadingPreview ? 'Generating...' : 'Preview Certificate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleDownload}
                          disabled={!name || !fatherName || !courseName || !grade || !courseDuration || !coursePeriodFrom || !coursePeriodTo || !certificateNumber || !issueDate}
                        >
                          Download Certificate (PDF)
                        </button>
                      </div>
                      
                      {/* Preview Image */}
                      {previewUrl && (
                        <div className="mt-3">
                          <h6>Preview:</h6>
                          <img 
                            src={previewUrl} 
                            alt="Certificate Preview" 
                            className="img-fluid border rounded" 
                            style={{ maxHeight: '400px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for certificate rendering */}
      <canvas id="certCanvas" ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}
