// src/pages/FranchiseCreate.jsx
import { useState } from 'react';
import API from "../api/axiosInstance";

// ---- Constants ----
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// All Indian states + UTs
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// Districts map – fully filled for Bihar, others can be extended later
const DISTRICTS_BY_STATE = {
  Bihar: [
    'Araria',
    'Arwal',
    'Aurangabad',
    'Banka',
    'Begusarai',
    'Bhagalpur',
    'Bhojpur',
    'Buxar',
    'Darbhanga',
    'East Champaran',
    'Gaya',
    'Gopalganj',
    'Jamui',
    'Jehanabad',
    'Kaimur',
    'Katihar',
    'Khagaria',
    'Kishanganj',
    'Lakhisarai',
    'Madhepura',
    'Madhubani',
    'Munger',
    'Muzaffarpur',
    'Nalanda',
    'Nawada',
    'Patna',
    'Purnia',
    'Rohtas',
    'Saharsa',
    'Samastipur',
    'Saran',
    'Sheikhpura',
    'Sheohar',
    'Sitamarhi',
    'Siwan',
    'Supaul',
    'Vaishali',
    'West Champaran',
  ],
  'Uttar Pradesh': [
    'Agra',
    'Aligarh',
    'Allahabad',
    'Ambedkar Nagar',
    'Amethi',
    'Amroha',
    'Auraiya',
    'Azamgarh',
    // extend as needed
  ],
};

// ---- Validation helpers ----
const isValidAadhar = (value) => /^\d{12}$/.test((value || '').trim());

const isValidPan = (value) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test((value || '').trim().toUpperCase());

const isValidPhone10 = (value) => /^\d{10}$/.test((value || '').trim());

const isStrongPassword = (value) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value || '');

const initialState = {
  instituteId: '',
  ownerName: '',
  instituteName: '',
  dob: '',
  aadharNumber: '',
  panNumber: '',
  address: '',
  state: '',
  district: '',
  operatorsCount: '',
  classRooms: '',
  totalComputers: '',
  centerSpace: '',
  whatsapp: '',
  contact: '',
  email: '',
  ownerQualification: '',
  hasReception: false,
  hasStaffRoom: false,
  hasWaterSupply: false,
  hasToilet: false,
  username: '',
  password: '',
};

export default function FranchiseCreate() {
  const [form, setForm] = useState(initialState);
  const [files, setFiles] = useState({
    aadharFront: null,
    aadharBack: null,
    panImage: null,
    institutePhoto: null,
    ownerSign: null,
    ownerImage: null,
    certificateFile: null,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const districtOptions = DISTRICTS_BY_STATE[form.state] || [];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'panNumber') {
      newValue = newValue.toUpperCase();
    }

    if (name === 'state') {
      setForm((prev) => ({
        ...prev,
        state: newValue,
        district: '',
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: f } = e.target;
    const file = f && f[0] ? f[0] : null;

    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `File "${file.name}" is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    setFiles((prev) => ({
      ...prev,
      [name]: file,
    }));
  };

  // username uniqueness via backend endpoint
  const checkUsernameUnique = async (username) => {
    const uname = (username || '').trim();
    if (!uname) return false;

    const res = await API.get('/franchises/check-username', {
      params: { username: uname },
    });

    const raw = res.data;


    // API.unwrap might return either the outer object or inner .data
    const payload = raw && raw.data ? raw.data : raw;
    const exists =
      payload && typeof payload.exists === 'boolean'
        ? payload.exists
        : false;

    return !exists;
  };

  const validateForm = () => {
    if (!form.instituteId.trim()) {
      setError('Institute ID is required.');
      return false;
    }
    if (!form.ownerName.trim()) {
      setError('Institute Owner Name is required.');
      return false;
    }
    if (!form.instituteName.trim()) {
      setError('Institute Name is required.');
      return false;
    }

    if (form.aadharNumber && !isValidAadhar(form.aadharNumber)) {
      setError('Aadhar Number must be exactly 12 digits.');
      return false;
    }

    if (form.panNumber && !isValidPan(form.panNumber)) {
      setError(
        'PAN Number must be a valid 10-character alphanumeric identifier (e.g. ABCDE1234F).'
      );
      return false;
    }

    if (!form.state) {
      setError('State is required.');
      return false;
    }
    if (!form.district) {
      setError('District is required.');
      return false;
    }

    if (form.whatsapp && !isValidPhone10(form.whatsapp)) {
      setError(
        'WhatsApp number must be a 10 digit mobile number (without +91).'
      );
      return false;
    }
    if (form.contact && !isValidPhone10(form.contact)) {
      setError(
        'Contact number must be a 10 digit mobile number (without +91).'
      );
      return false;
    }

    if (!form.username.trim()) {
      setError('Username is required.');
      return false;
    }

    if (!form.password) {
      setError('Password is required.');
      return false;
    }

    if (!isStrongPassword(form.password)) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, number and special character.'
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) return;

    setSaving(true);

    try {
      // 1) Username uniqueness
      let isUnique;
      try {
        isUnique = await checkUsernameUnique(form.username);
      } catch (checkErr) {
        console.error('username uniqueness check failed:', checkErr);
        setSaving(false);
        setError(
          'Could not verify username uniqueness. Please check your server / network.'
        );
        return;
      }

      if (!isUnique) {
        setSaving(false);
        setError(
          'Username already exists for a student or a franchise. Please choose a different username.'
        );
        return;
      }

      // 2) Re-check file sizes
      for (const [, file] of Object.entries(files)) {
        if (file && file.size > MAX_FILE_SIZE_BYTES) {
          setSaving(false);
          setError(
            `File "${file.name}" is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
          );
          return;
        }
      }

      // 3) Build FormData
      const payload = { ...form };

      if (payload.whatsapp) {
        payload.whatsapp = `+91${payload.whatsapp.trim()}`;
      }
      if (payload.contact) {
        payload.contact = `+91${payload.contact.trim()}`;
      }

      const fd = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          fd.append(key, value);
        }
      });

      Object.entries(files).forEach(([key, file]) => {
        if (file) fd.append(key, file);
      });
      
      const res = await API.post('/franchises', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const created = res.data;


      console.log('created franchise', created);
      setMessage('Franchise created successfully.');
      setForm(initialState);
      setFiles({
        aadharFront: null,
        aadharBack: null,
        panImage: null,
        institutePhoto: null,
        ownerSign: null,
        ownerImage: null,
        certificateFile: null,
      });

      // Go to list page so user sees new record
      window.location.href = '/franchise/list';
    } catch (err) {
      console.error('create franchise error:', err);
      setError(err.userMessage || 'Failed to create franchise');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Create Franchise</h2>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card shadow-sm">
        <div className="card-body">
          {/* IDs */}
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">
                Institute ID <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="instituteId"
                value={form.instituteId}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Institute Owner Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Institute Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="instituteName"
                value={form.instituteName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* personal info */}
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                name="dob"
                value={form.dob}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Aadhar Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="aadharNumber"
                value={form.aadharNumber}
                onChange={handleChange}
                maxLength={12}
                placeholder="12 digit number"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                PAN Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="panNumber"
                value={form.panNumber}
                onChange={handleChange}
                maxLength={10}
                placeholder="ABCDE1234F"
              />
            </div>
          </div>

          {/* address */}
          <div className="mb-3">
            <label className="form-label">
              Full Institute Address <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control"
              name="address"
              rows={2}
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
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
            <div className="col-md-4">
              <label className="form-label">
                District <span className="text-danger">*</span>
              </label>
              {districtOptions.length > 0 ? (
                <select
                  className="form-select"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  disabled={!form.state}
                >
                  <option value="">Select District</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder={
                    form.state
                      ? 'Enter district (list not configured yet)'
                      : 'Select state first'
                  }
                  disabled={!form.state}
                />
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label">Space of Computer Center</label>
              <input
                type="text"
                className="form-control"
                name="centerSpace"
                value={form.centerSpace}
                onChange={handleChange}
                placeholder="e.g. 500 sq ft"
              />
            </div>
          </div>

          {/* infra */}
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">
                Number of Computer Operators
              </label>
              <input
                type="number"
                className="form-control"
                name="operatorsCount"
                value={form.operatorsCount}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Number of Class Rooms</label>
              <input
                type="number"
                className="form-control"
                name="classRooms"
                value={form.classRooms}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Total Computers</label>
              <input
                type="number"
                className="form-control"
                name="totalComputers"
                value={form.totalComputers}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          {/* contact */}
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">
                WhatsApp Number <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">+91</span>
                <input
                  type="text"
                  className="form-control"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder="10 digit number"
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Contact Number <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">+91</span>
                <input
                  type="text"
                  className="form-control"
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder="10 digit number"
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Email ID</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* qualification + facilities */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">
                Qualification of Institute Head
              </label>
              <input
                type="text"
                className="form-control"
                name="ownerQualification"
                value={form.ownerQualification}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6 d-flex flex-wrap align-items-center gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasReception"
                  name="hasReception"
                  checked={form.hasReception}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="hasReception">
                  Reception
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasStaffRoom"
                  name="hasStaffRoom"
                  checked={form.hasStaffRoom}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="hasStaffRoom">
                  Staff Room
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasWaterSupply"
                  name="hasWaterSupply"
                  checked={form.hasWaterSupply}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="hasWaterSupply">
                  Water Supply
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="hasToilet"
                  name="hasToilet"
                  checked={form.hasToilet}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="hasToilet">
                  Toilet
                </label>
              </div>
            </div>
          </div>

          {/* login */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">
                Username <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                name="username"
                value={form.username}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                Password <span className="text-danger">*</span>
              </label>

              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="Strong password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>



              <div className="form-text">
                Min 8 chars, include uppercase, lowercase, number and special
                character.
              </div>
            </div>
          </div>

          {/* file uploads */}
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">
                Aadhar Front Image (max {MAX_FILE_SIZE_MB} MB)
              </label>
              <input
                type="file"
                name="aadharFront"
                accept="image/*"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Aadhar Back Image (max {MAX_FILE_SIZE_MB} MB)
              </label>
              <input
                type="file"
                name="aadharBack"
                accept="image/*"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                PAN Image (max {MAX_FILE_SIZE_MB} MB)
              </label>
              <input
                type="file"
                name="panImage"
                accept="image/*"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label">
                Institute Photo (max {MAX_FILE_SIZE_MB} MB)
              </label>
              <input
                type="file"
                name="institutePhoto"
                accept="image/*"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Center Owner Sign (max {MAX_FILE_SIZE_MB} MB)
              </label>
              <input
                type="file"
                name="ownerSign"
                accept="image/*"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">
                Franchise Owner Image (max {MAX_FILE_SIZE_MB} MB)
              </label>
              <input
                type="file"
                name="ownerImage"
                accept="image/*"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">
                Upload Certificate (max {MAX_FILE_SIZE_MB} MB)
              </label>
              <input
                type="file"
                name="certificateFile"
                accept="image/*,application/pdf"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <div className="card-footer text-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Create Franchise'}
          </button>
        </div>
      </form>
    </div>
  );
}
