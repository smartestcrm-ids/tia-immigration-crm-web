import { useEffect, useState } from 'react';
import { api, getToken } from '../api.js';

const RELATIONS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'];
const DOC_CATEGORIES = ['PASSPORT', 'BIRTH_CERT', 'MARRIAGE_CERT', 'IELTS', 'DIPLOMA', 'VISA', 'CONTRACT', 'OTHER'];

function dateToInput(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(+date)) return '';
  return date.toISOString().slice(0, 10);
}

export default function ClientProfileSection({ leadId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileDraft, setProfileDraft] = useState({});
  const [error, setError] = useState(null);

  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [newMember, setNewMember] = useState({ relation: 'SPOUSE', fullName: '' });

  const [docCategory, setDocCategory] = useState('PASSPORT');
  const [docFamilyId, setDocFamilyId] = useState('');
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.clientProfile(leadId);
      setProfile(data);
      if (data) {
        setProfileDraft({
          dateOfBirth: dateToInput(data.dateOfBirth),
          nationality: data.nationality || '',
          passportNumber: data.passportNumber || '',
          passportExpiry: dateToInput(data.passportExpiry),
          address: data.address || '',
          notes: data.notes || '',
        });
      } else {
        setProfileDraft({ dateOfBirth: '', nationality: '', passportNumber: '', passportExpiry: '', address: '', notes: '' });
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [leadId]);

  async function saveProfile(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        dateOfBirth: profileDraft.dateOfBirth || null,
        nationality: profileDraft.nationality || null,
        passportNumber: profileDraft.passportNumber || null,
        passportExpiry: profileDraft.passportExpiry || null,
        address: profileDraft.address || null,
        notes: profileDraft.notes || null,
      };
      await api.updateClientProfile(leadId, payload);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function addMember(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.addFamilyMember(leadId, newMember);
      setNewMember({ relation: 'SPOUSE', fullName: '' });
      setShowFamilyForm(false);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function deleteMember(memberId) {
    if (!confirm('Remove this family member?')) return;
    await api.deleteFamilyMember(leadId, memberId);
    load();
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10 MB)');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await api.uploadDocument(leadId, {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        category: docCategory,
        contentBase64: base64,
        familyMemberId: docFamilyId ? Number(docFamilyId) : null,
      });
      e.target.value = '';
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(docId) {
    if (!confirm('Delete this document?')) return;
    try {
      await api.deleteDocument(leadId, docId);
      load();
    } catch (e) { setError(e.message); }
  }

  function downloadDoc(doc) {
    // Authenticated download — fetch as blob, then trigger save
    const token = getToken();
    fetch(api.documentDownloadUrl(leadId, doc.id), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
  }

  if (loading) return <p className="text-slate-500">Loading client profile...</p>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
          {error}
        </div>
      )}

      <section className="bg-white rounded-lg border shadow-sm p-5">
        <h2 className="font-semibold mb-3">Client details</h2>
        <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Date of birth</label>
            <input type="date" value={profileDraft.dateOfBirth || ''}
              onChange={(e) => setProfileDraft({ ...profileDraft, dateOfBirth: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Nationality</label>
            <input value={profileDraft.nationality || ''}
              onChange={(e) => setProfileDraft({ ...profileDraft, nationality: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Passport #</label>
            <input value={profileDraft.passportNumber || ''}
              onChange={(e) => setProfileDraft({ ...profileDraft, passportNumber: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Passport expiry</label>
            <input type="date" value={profileDraft.passportExpiry || ''}
              onChange={(e) => setProfileDraft({ ...profileDraft, passportExpiry: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-600 mb-1">Address</label>
            <input value={profileDraft.address || ''}
              onChange={(e) => setProfileDraft({ ...profileDraft, address: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-600 mb-1">Notes</label>
            <textarea value={profileDraft.notes || ''}
              onChange={(e) => setProfileDraft({ ...profileDraft, notes: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm" rows={2} />
          </div>
          <div className="md:col-span-2">
            <button className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm hover:bg-brand-700">
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-lg border shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Family members</h2>
          <button
            onClick={() => setShowFamilyForm((s) => !s)}
            className="px-3 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700"
          >
            {showFamilyForm ? 'Cancel' : '+ Add family member'}
          </button>
        </div>

        {showFamilyForm && (
          <form onSubmit={addMember} className="flex gap-2 items-end mb-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Relation</label>
              <select
                value={newMember.relation}
                onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                className="border rounded px-2 py-1.5 text-sm"
              >
                {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-600 mb-1">Full name</label>
              <input
                required
                value={newMember.fullName}
                onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
            <button className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm">Add</button>
          </form>
        )}

        {!profile?.familyMembers?.length && <p className="text-sm text-slate-500">No family members yet.</p>}
        <ul className="divide-y">
          {profile?.familyMembers?.map((m) => (
            <li key={m.id} className="py-2 flex items-center gap-3">
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{m.relation}</span>
              <span className="font-medium">{m.fullName}</span>
              {m.nationality && <span className="text-xs text-slate-500">· {m.nationality}</span>}
              {m.dateOfBirth && <span className="text-xs text-slate-500">· DOB {dateToInput(m.dateOfBirth)}</span>}
              {m.passportNumber && <span className="text-xs text-slate-500">· {m.passportNumber}</span>}
              <button
                onClick={() => deleteMember(m.id)}
                className="ml-auto text-xs text-red-600 hover:underline"
              >Remove</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg border shadow-sm p-5">
        <h2 className="font-semibold mb-3">Documents</h2>
        <div className="flex gap-2 items-end mb-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Category</label>
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm"
            >
              {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">For</label>
            <select
              value={docFamilyId}
              onChange={(e) => setDocFamilyId(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm"
            >
              <option value="">Main client</option>
              {profile?.familyMembers?.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName} ({m.relation})</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-600 mb-1">File (max 10 MB)</label>
            <input type="file" onChange={handleFileUpload} disabled={uploading}
              className="w-full text-sm" />
          </div>
        </div>
        {uploading && <p className="text-xs text-slate-500 mb-2">Uploading…</p>}

        {!profile?.documents?.length && <p className="text-sm text-slate-500">No documents yet.</p>}
        <ul className="divide-y">
          {profile?.documents?.map((d) => {
            const member = d.familyMemberId
              ? profile.familyMembers.find((m) => m.id === d.familyMemberId)
              : null;
            return (
              <li key={d.id} className="py-2 flex items-center gap-3 text-sm">
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">{d.category}</span>
                <button onClick={() => downloadDoc(d)} className="font-medium hover:underline">
                  {d.filename}
                </button>
                <span className="text-xs text-slate-500">{Math.ceil(d.size / 1024)} KB</span>
                {member && <span className="text-xs text-slate-500">· {member.fullName}</span>}
                <span className="text-xs text-slate-400 ml-auto">{new Date(d.createdAt).toLocaleDateString()}</span>
                <button onClick={() => deleteDoc(d.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
