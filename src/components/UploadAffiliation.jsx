// src/components/UploadAffiliation.jsx
import React, { useState } from 'react';
import api from '../api/axiosInstance'; // adjust path if needed

export default function UploadAffiliation() {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  };

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!name.trim()) return setMessage({ type: 'error', text: 'Name is required' });

    try {
      let imgUrl = previewUrl; // if you want to skip upload and use preview (not recommended)
      if (file) {
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const upRes = await api.post('/uploads', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploading(false);
        if (!upRes.data || !upRes.data.url) {
          throw new Error('Upload did not return a url');
        }
        imgUrl = upRes.data.url;
      } else {
        setMessage({ type: 'error', text: 'Please choose an image file to upload' });
        return;
      }

      // Create affiliation record in DB
      setSaving(true);
      const body = { name: name.trim(), subtitle: subtitle.trim(), img: imgUrl, link: link.trim() || '' };
      const createRes = await api.post('/affiliations', body);
      setSaving(false);

      setMessage({ type: 'success', text: 'Affiliation saved' });
      // clear form
      setName('');
      setSubtitle('');
      setLink('');
      setFile(null);
      setPreviewUrl(null);

      // optionally: emit an event or refresh list
    } catch (err) {
      setUploading(false);
      setSaving(false);
      console.error(err);
      const msg = err?.response?.data?.message || err.message || 'Failed';
      setMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h3>Create Affiliation</h3>
      {message && (
        <div style={{
          padding: 10, marginBottom: 12,
          background: message.type === 'error' ? '#fdecea' : '#e6ffed',
          color: message.type === 'error' ? '#a70d2b' : '#0b6a2e',
          borderRadius: 6
        }}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleUploadAndSave}>
        <div className="mb-3">
          <label className="form-label">Name *</label>
          <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Subtitle</label>
          <input className="form-control" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="form-label">Optional link (website)</label>
          <input className="form-control" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
        </div>

        <div className="mb-3">
          <label className="form-label">Image (jpg/png/webp)</label>
          <input className="form-control" type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        {previewUrl && (
          <div className="mb-3">
            <img src={previewUrl} alt="preview" style={{ maxWidth: 240, maxHeight: 240, objectFit: 'cover' }} />
          </div>
        )}

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={uploading || saving}>
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Upload & Save'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => {
            setName(''); setSubtitle(''); setLink(''); setFile(null); setPreviewUrl(null); setMessage(null);
          }}>Reset</button>
        </div>
      </form>
    </div>
  );
}
