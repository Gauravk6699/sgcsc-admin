// admin-panel/src/components/AddStudentModal.jsx
import { useEffect, useState } from 'react';
import API from "../api/axiosInstance";

const emptyForm = {
  rollNo: '',
  name: '',
  email: '',
  courseId: '',
  semester: 1,
  joinDate: '',
  dob: '',
  contact: '',
  address: '',
  isCertified: false,
};

export default function AddStudentModal({
  show,
  onClose,
  onSaved,
  editingStudent,
}) {
  const [form, setForm] = useState(emptyForm);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load courses from /courses endpoint
  useEffect(() => {
    if (!show) return;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      setError('');
      try {
        const data = await API.unwrap(API.get('/courses'));
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setCourses(arr);
      } catch (err) {
        console.error('fetchCourses error:', err);
        setError(err.userMessage || 'Failed to fetch courses');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [show]);

  // Populate form when editing
  useEffect(() => {
    if (!show) return;

    if (editingStudent) {
      setForm({
        rollNo: editingStudent.rollNo || '',
        name: editingStudent.name || '',
        email: editingStudent.email || '',
        courseId:
          editingStudent.course?._id ||
          editingStudent.courseId ||
          editingStudent.course ||
          '',
        semester: editingStudent.semester || 1,
        joinDate: editingStudent.joinDate
          ? new Date(editingStudent.joinDate).toISOString().substring(0, 10)
          : '',
        dob: editingStudent.dob
          ? new Date(editingStudent.dob).toISOString().substring(0, 10)
          : '',
        contact: editingStudent.contact || '',
        address: editingStudent.address || '',
        isCertified: !!editingStudent.isCertified,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingStudent, show]);

  const closeModal = () => {
    if (saving) return;
    setError('');
    setForm(emptyForm);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validate = () => {
    if (!form.rollNo.trim() || !form.name.trim()) {
      setError('Roll No and Name are required.');
      return false;
    }
    if (!form.courseId) {
      setError('Please select a course.');
      return false;
    }
    if (!form.joinDate) {
      setError('Please select a joining date.');
      return false;
    }
    if (form.contact && !/^\d{10}$/.test(form.contact)) {
      setError('Contact must be a 10-digit phone number.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError('');

    const payload = {
      rollNo: form.rollNo.trim(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      courseId: form.courseId,
      semester: Number(form.semester) || 1,
      joinDate: form.joinDate,
      dob: form.dob || undefined,
      contact: form.contact || undefined,
      address: form.address || undefined,
      isCertified: !!form.isCertified,
    };

    try {
      let saved;
      if (editingStudent) {
        const id = editingStudent._id || editingStudent.id;
        saved = await API.unwrap(API.put(`/students/${id}`, payload));
      } else {
        saved = await API.unwrap(API.post('/students', payload));
      }
      onSaved(saved);
      closeModal();
    } catch (err) {
      console.error('save student error:', err);
      setError(
        err.userMessage ||
          err.response?.data?.message ||
          'Failed to save student'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
                disabled={saving}
              />
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Roll No *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="rollNo"
                    value={form.rollNo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-select"
                    name="courseId"
                    value={form.courseId}
                    onChange={handleChange}
                    required
                    disabled={loadingCourses}
                  >
                    <option value="">
                      {loadingCourses ? 'Loading courses…' : 'Select course'}
                    </option>
                    {courses.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name || c.title || 'Unnamed course'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Semester</label>
                  <input
                    type="number"
                    className="form-control"
                    name="semester"
                    value={form.semester}
                    min="1"
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Join Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    name="joinDate"
                    value={form.joinDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">DOB</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Contact (10-digit)</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="9876543210"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Certified Student</label>
                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isCertified"
                      name="isCertified"
                      checked={form.isCertified}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="isCertified">
                      Show in "Certified Students" list
                    </label>
                  </div>
                </div>

                <div className="col-md-12">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? 'Saving…'
                  : editingStudent
                  ? 'Update Student'
                  : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
