// src/components/Members.jsx
import React, { useEffect, useState } from 'react';
import api from '../import API from "../api/axiosInstance";
';

export default function Members(){
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name:'', role:'', bio:'', img:'' });
  const [editing, setEditing] = useState(null);

  useEffect(()=>{ fetchMembers(); }, []);
  async function fetchMembers(){ try { const res = await api.get('/members'); setList(res.data.data ?? res.data ?? []); } catch(e){console.error(e); alert('Failed'); } }

  async function handleUpload(e){
    const file = e.target.files[0]; if(!file) return; const fd=new FormData(); fd.append('file',file);
    try{ const r = await api.post('/uploads', fd, { headers:{ 'Content-Type':'multipart/form-data' } }); const url = r.data.data?.url ?? r.data.url ?? r.data?.url; setForm(f=>({...f, img:url})); }catch(err){console.error(err); alert('Upload failed');}
  }

  async function save(e){ e?.preventDefault();
    try{
      if(editing) await api.patch(`/members/${editing}`, form); else await api.post('/members', form);
      setForm({ name:'', role:'', bio:'', img:'' }); setEditing(null); fetchMembers();
    }catch(err){console.error(err); alert('Save failed');}
  }

  async function del(id){ if(!confirm('Delete member?')) return; try{ await api.delete(`/members/${id}`); fetchMembers(); }catch(err){console.error(err); alert('Delete failed'); } }

  return (
    <div className="container p-3">
      <h3>Institute Members</h3>
      <form onSubmit={save} className="card p-3 mb-3">
        <div className="mb-2"><input className="form-control" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
        <div className="mb-2"><input className="form-control" placeholder="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/></div>
        <div className="mb-2"><textarea className="form-control" placeholder="Bio" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></div>
        <div className="mb-2"><input type="file" className="form-control" onChange={handleUpload} /></div>
        {form.img && <img src={form.img} alt="" style={{width:140}} />}
        <div className="mt-2">
          <button className="btn btn-primary me-2">{editing ? 'Update' : 'Create'}</button>
          {editing && <button type="button" className="btn btn-secondary" onClick={()=>{ setEditing(null); setForm({ name:'', role:'', bio:'', img:'' }) }}>Cancel</button>}
        </div>
      </form>

      <div className="row">
        {list.map(m => (
          <div className="col-md-3 mb-3" key={m._id || m.id}>
            <div className="card p-2">
              <img src={m.img} alt={m.name} className="img-fluid" style={{height:140, objectFit:'cover'}} />
              <h6 className="mt-2">{m.name}</h6>
              <p className="small text-muted">{m.role}</p>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary" onClick={()=>{ setEditing(m._id || m.id); setForm({ name:m.name, role:m.role, bio:m.bio, img:m.img }); }}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>del(m._id || m.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
