// src/components/UploadField.jsx
import React, { useState } from 'react';
import API from "../api/axiosInstance";

export default function UploadField({ onUploaded, accept = 'image/*' }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const onFile = e => setFile(e.target.files[0]);

  const upload = async () => {
    if (!file) return alert('Select a file');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await API.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' }});
      const payload = res.data.data || res.data;
      onUploaded && onUploaded(payload);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <input type="file" accept={accept} onChange={onFile} />
      {file && <div style={{ marginTop: 8 }}>{file.name} • {(file.size/1024).toFixed(1)} KB</div>}
      <button type="button" onClick={upload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
