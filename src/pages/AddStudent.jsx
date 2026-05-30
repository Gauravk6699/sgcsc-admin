// src/pages/AddStudent.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

// ---- Constants ----
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const initialForm = {
  centerName: "",
  name: "",
  gender: "",
  fatherName: "",
  motherName: "",
  dob: "",
  email: "",
  mobile: "", 
  state: "",
  district: "",
  address: "",
  examPassed: "",
  marksOrGrade: "",
  board: "",
  passingYear: "",
  username: "",
  password: "",
  courseId: "",
  courseName: "",
  sessionStart: "",
  sessionEnd: "",
  feesPaid: false,
  isCertified: false,
  rollNumber: "",
  enrollmentNo: "",
  feeAmount: 0,
  courses: [{
    courseId: "",
    courseName: "",
    feeAmount: 0,
    amountPaid: 0,
    feesPaid: false,
    sessionStart: "",
    sessionEnd: "",
  }]
};

const MAX_PHOTO_SIZE_MB = 2;
const MAX_PHOTO_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

export default function AddStudent() {
  const [form, setForm] = useState(initialForm);
  const [courses, setCourses] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);


  const navigate = useNavigate();

  // ---------- Meta (courses + franchises) ----------
  useEffect(() => {
    let mounted = true;

    async function loadMeta() {
      setLoadingMeta(true);
      setError("");
      try {
        const [coursesRes, franchisesRes] = await Promise.allSettled([
          API.get("/courses"),
          API.get("/franchises"),
        ]);


        if (mounted && coursesRes.status === "fulfilled") {
          const data = coursesRes.value.data;
          setCourses(Array.isArray(data) ? data : data?.data || []);
        }

        if (mounted && franchisesRes.status === "fulfilled") {
          const data = franchisesRes.value.data;
          setFranchises(Array.isArray(data) ? data : data?.data || []);
        }

      } catch (err) {
        console.error("loadMeta error:", err);
        if (mounted) {
          setError(
            err.userMessage ||
              "Failed to load courses / franchises. You can still fill the form."
          );
        }
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    }

    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  // ---------- Helpers ----------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkboxes properly
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    // Mobile: digits only, max 10
    if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, mobile: digits }));
      return;
    }

    // State change → reset district
    if (name === "state") {
      setForm((prev) => ({
        ...prev,
        state: value,
        district: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // Handle adding a new course to the student's courses list
  const handleAddCourse = () => {
    const newCourse = {
      courseId: "",
      courseName: "",
      feeAmount: 0,
      amountPaid: 0,
      feesPaid: false,
      sessionStart: "",
      sessionEnd: "",
    };
    setForm((prev) => ({
      ...prev,
      courses: [...(prev.courses || []), newCourse],
    }));
  };

  // Handle removing a course from the student's courses list
  const handleRemoveCourse = (index) => {
    setForm((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
    }));
  };

  // Handle change for a specific course in the courses array
  const handleCourseArrayChange = (index, field, value) => {
    setForm((prev) => {
      const updatedCourses = [...(prev.courses || [])];
      
      if (field === "courseId") {
        const selected = courses.find(
          (c) => (c._id || c.id || "").toString() === value
        );
        updatedCourses[index] = {
          ...updatedCourses[index],
          courseId: value,
          courseName: selected ? selected.name || selected.title || "" : "",
          feeAmount: selected ? selected.feeAmount || 0 : updatedCourses[index].feeAmount || 0,
        };
      } else if (field === "amountPaid") {
        updatedCourses[index] = {
          ...updatedCourses[index],
          amountPaid: Number(value) || 0,
        };
      } else if (field === "feesPaid") {
        updatedCourses[index] = {
          ...updatedCourses[index],
          feesPaid: value,
        };
      } else {
        updatedCourses[index] = {
          ...updatedCourses[index],
          [field]: value,
        };
      }
      
      return { ...prev, courses: updatedCourses };
    });
  };

  const handleFranchiseChange = (e) => {
    const value = e.target.value;
    const selected = franchises.find(
      (f) => (f._id || f.id || "").toString() === value
    );
    setForm((prev) => ({
      ...prev,
      centerName:
        selected?.instituteName ||
        selected?.centerName ||
        selected?.name ||
        "",
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setError(
        `Photo is too large. Maximum allowed size is ${MAX_PHOTO_SIZE_MB} MB.`
      );
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const isValidMobile = (digits) => /^\d{10}$/.test(digits || "");

  const validateForm = () => {
    if (!form.rollNumber.trim()) {
      setError("Roll number is required.");
      return false;
    }

    if (!form.enrollmentNo.trim()) {
      setError("Enrollment number is required.");
      return false;
    }

    if (!form.centerName.trim()) {
      setError("Center Name is required.");
      return false;
    }
    if (!form.name.trim()) {
      setError("Student Name is required.");
      return false;
    }
    if (!isValidMobile(form.mobile)) {
      setError("Mobile number must be exactly 10 digits (without +91).");
      return false;
    }
    if (!form.state) {
      setError("State is required.");
      return false;
    }
    if (!form.district) {
      setError("District is required.");
      return false;
    }
    if (!form.address.trim()) {
      setError("Full address is required.");
      return false;
    }
    return true;
  };

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const fd = new FormData();

      // Prepare courses array for payload
      const coursesPayload = form.courses ? form.courses.map(c => ({
        course: c.courseId || null,
        courseName: c.courseName,
        feeAmount: Number(c.feeAmount) || 0,
        amountPaid: Number(c.amountPaid) || 0,
        feesPaid: c.feesPaid || false,
        sessionStart: c.sessionStart || null,
        sessionEnd: c.sessionEnd || null,
      })) : [];

      // Append form fields
      const payload = {
        ...form,
        // store with +91 prefix as requested
        mobile: `+91${form.mobile}`,
        feeAmount: Number(form.feeAmount) || 0,
        amountPaid: Number(form.amountPaid) || 0,
        courses: coursesPayload,
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            // Stringify array fields
            fd.append(key, JSON.stringify(value));
          } else {
            fd.append(key, value);
          }
        }
      });

      // Append photo file
      if (photoFile) {
        fd.append("photo", photoFile); // backend field name: "photo"
      }


      const res = await API.post("/students", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = res.data;

      console.log("student created:", created);

      setSuccess("Student added successfully.");
      setForm(initialForm);
      setPhotoFile(null);
      setPhotoPreview("");

      setTimeout(() => {
        navigate("/students");
      }, 800);
    } catch (err) {
      console.error("add student error:", err);
      setError(err.userMessage || "Failed to add student");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-0">Add Student</h2>
          <small className="text-muted">
            Fill all required details to register a new student.
          </small>
        </div>
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => navigate("/students")}
        >
          Back to Students
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card shadow-sm mx-auto"
        style={{ maxWidth: "1400px" }}
      >

        <div className="card-body">
          {loadingMeta && (
            <div className="mb-3 small text-muted">
              Loading courses / franchises…
            </div>
          )}

          {/* Center / Franchise */}
          <div className="row g-4 mb-4">
            <div className="col-lg-4 col-md-4">
              <label className="form-label">
                Center / Institute (Franchise)
              </label>
              <select
                className="form-select"
                onChange={handleFranchiseChange}
                disabled={!franchises.length}
              >
                <option value="">Select Franchise (optional)</option>
                {franchises.map((f) => (
                  <option key={f._id || f.id} value={f._id || f.id}>
                    {f.instituteName || f.centerName || f.ownerName || "Unnamed"}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                This will pre-fill the center name, or you can type manually.
              </small>
            </div>
            <div className="col-lg-4 col-md-4">
              <label className="form-label">
                Center Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="centerName"
                value={form.centerName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-lg-4 col-md-4">
              <label className="form-label">
                Roll Number 
                <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-lg-4">
              <label className="form-label">
                Enrollment Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="enrollmentNo"
                value={form.enrollmentNo}
                onChange={handleChange}
                placeholder="Enter enrollment number"
                required
              />
            </div>

          </div>

          {/* Basic identity */}
          <div className="row g-3 mb-3">
            <div className="col-lg-4">
              <label className="form-label">
                Student Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-lg-4">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-lg-4">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                name="dob"
                value={form.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Parents */}
          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <label className="form-label">Father&apos;s Name</label>
              <input
                type="text"
                className="form-control"
                name="fatherName"
                value={form.fatherName}
                onChange={handleChange}
              />
            </div>
            <div className="col-lg-6">
              <label className="form-label">Mother&apos;s Name</label>
              <input
                type="text"
                className="form-control"
                name="motherName"
                value={form.motherName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="col-lg-6">
              <label className="form-label">
                Mobile Number <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">+91</span>
                <input
                  type="tel"
                  className="form-control"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="10 digit number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="row g-3 mb-3">
            <div className="col-lg-3">
              <label className="form-label">
                State <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                name="state"
                value={form.state}
                onChange={handleChange}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-3">
              <div>
                <label className="form-label">
                  District <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="Enter district name"
                  required
                />
              </div>
            </div>

            <div className="col-lg-6">
              <label className="form-label">
                Full Address <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                name="address"
                rows={1}
                value={form.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Academic background */}
          <div className="row g-3 mb-3">
            <div className="col-lg-3">
              <label className="form-label">Exam Passed</label>
              <input
                type="text"
                className="form-control"
                name="examPassed"
                value={form.examPassed}
                onChange={handleChange}
                placeholder="10th / 12th / Graduation, etc."
              />
            </div>
            <div className="col-lg-3">
              <label className="form-label">Marks (%) / Grade</label>
              <input
                type="text"
                className="form-control"
                name="marksOrGrade"
                value={form.marksOrGrade}
                onChange={handleChange}
              />
            </div>
            <div className="col-lg-3">
              <label className="form-label">Board</label>
              <input
                type="text"
                className="form-control"
                name="board"
                value={form.board}
                onChange={handleChange}
              />
            </div>
            <div className="col-lg-3">
              <label className="form-label">Passing Year</label>
              <input
                type="text"
                className="form-control"
                name="passingYear"
                value={form.passingYear}
                onChange={handleChange}
              />
            </div>
          </div>



          {/* Multiple Courses Section */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Courses</h6>
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={handleAddCourse}
              >
                + Add Course
              </button>
            </div>
            
            {form.courses && form.courses.map((course, index) => (
              <div key={index} className="card mb-3">
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label small">Course {index + 1}</label>
                      <select
                        className="form-select form-select-sm"
                        value={course.courseId || ""}
                        onChange={(e) => handleCourseArrayChange(index, 'courseId', e.target.value)}
                      >
                        <option value="">Select Course</option>
                        {courses.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.title || c.name || "Untitled"} {c.feeAmount > 0 ? `(₹${c.feeAmount})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={course.feeAmount || 0}
                        onChange={(e) => handleCourseArrayChange(index, 'feeAmount', e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Paid (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={course.amountPaid || 0}
                        onChange={(e) => handleCourseArrayChange(index, 'amountPaid', e.target.value)}
                        min="0"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small">Paid?</label>
                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={course.feesPaid || false}
                          onChange={(e) => handleCourseArrayChange(index, 'feesPaid', e.target.checked)}
                        />
                        <label className="form-check-label small">Yes</label>
                      </div>
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      {form.courses.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveCourse(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="row g-2 mt-2">
                    <div className="col-md-4">
                      <label className="form-label small">Session Start</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={course.sessionStart || ""}
                        onChange={(e) => handleCourseArrayChange(index, 'sessionStart', e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Session End</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={course.sessionEnd || ""}
                        onChange={(e) => handleCourseArrayChange(index, 'sessionEnd', e.target.value)}
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <span className="badge bg-warning text-dark">
                        Pending: ₹{((course.feeAmount || 0) - (course.amountPaid || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Photo upload */}
          <div className="row g-3 mb-3 align-items-end">
            <div className="col-lg-8">
              <label className="form-label">
                Student Photo (max {MAX_PHOTO_SIZE_MB} MB)
              </label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            {photoPreview && (
              <div className="col-lg-4 text-center d-flex flex-column align-items-start">
                <label className="form-label">Preview</label>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    width: 96,
                    height: 96,
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            )}
          </div>

          {/* ================= STATUS ================= */}
          <div className="row g-3 mb-3">
            <div className="col-lg-6 form-check">
              <input className="form-check-input" type="checkbox" name="feesPaid" checked={form.feesPaid} onChange={handleChange} />
              <label className="form-check-label">Fees Paid</label>
            </div>
            <div className="col-lg-6 form-check">
              <input className="form-check-input" type="checkbox" name="isCertified" checked={form.isCertified} onChange={handleChange} />
              <label className="form-check-label">Certified</label>
            </div>
          </div>


          {/* Login credentials */}
          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                name="username"
                value={form.username}
                onChange={handleChange}
              />
            </div>
            <div className="col-lg-6">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                />
                <span
                  className="input-group-text"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/students")}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save Student"}
          </button>
        </div>
      </form>
    </div>
  );
}
