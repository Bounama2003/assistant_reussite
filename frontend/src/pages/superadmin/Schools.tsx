import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { School, Plus, Search, Trash2, Edit3, Key, Copy, Check, ToggleLeft, ToggleRight, Loader2, Globe, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { SchoolAdmin, SchoolCreate, SchoolUpdate } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from '@/lib/ui';

export default function SuperAdminSchools() {
  const { superAdminKey } = useAuthStore();
  const [schools, setSchools] = useState<SchoolAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<SchoolAdmin | null>(null);
  const [newAdminKey, setNewAdminKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    if (!superAdminKey) return;
    setLoading(true);
    api.get('/admin/schools', { headers: { 'X-Super-Admin-Key': superAdminKey } })
      .then((res) => setSchools(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [superAdminKey]);

  const handleCreate = async (form: SchoolCreate) => {
    if (!superAdminKey) return;
    try {
      const res = await api.post<SchoolAdmin>('/admin/schools', form, {
        headers: { 'X-Super-Admin-Key': superAdminKey },
      });
      setNewAdminKey(res.data.admin_key);
      setShowCreate(false);
      load();
      toast.success('École créée avec succès');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const handleUpdate = async (schoolId: string, data: SchoolUpdate) => {
    if (!superAdminKey) return;
    try {
      await api.put(`/admin/schools/${schoolId}`, data, {
        headers: { 'X-Super-Admin-Key': superAdminKey },
      });
      setShowEdit(null);
      load();
      toast.success('École mise à jour');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (schoolId: string) => {
    try {
      await api.delete(`/admin/schools/${schoolId}`, {
        headers: { 'X-Super-Admin-Key': superAdminKey },
      });
      load();
      toast.success('École supprimée');
    } catch (err) { toast.error('Erreur lors de la suppression'); }
  };

  const handleToggleSuspend = async (school: SchoolAdmin) => {
    if (!superAdminKey) return;
    try {
      const endpoint = school.is_suspended ? 'activate' : 'suspend';
      await api.post(`/admin/schools/${school.id}/${endpoint}`, {}, {
        headers: { 'X-Super-Admin-Key': superAdminKey },
      });
      load();
    } catch (err) { console.error(err); }
  };

  const handleResetKey = async (schoolId: string) => {
    if (!superAdminKey) return;
    try {
      const res = await api.post(`/admin/schools/${schoolId}/reset-key`, {}, {
        headers: { 'X-Super-Admin-Key': superAdminKey },
      });
      setNewAdminKey(res.data.admin_key);
      setCopied(false);
      load();
    } catch (err) { console.error(err); }
  };

  const copyKey = () => {
    if (newAdminKey) {
      navigator.clipboard.writeText(newAdminKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filtered = schools.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Écoles</h1>
          <p className="text-nuit-300 text-sm">{schools.length} établissement(s)</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-1">
          <Plus size={14} /> Ajouter une école
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10!" placeholder="Rechercher..." />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <School className="w-12 h-12 text-nuit-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucune école</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-hover flex items-center gap-4 py-4"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: s.primary_color + '20' }}
              >
                <School className="w-5 h-5" style={{ color: s.primary_color }} />
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-nuit-400">ID</p>
                  <p className="text-sm font-mono text-white">{s.id}</p>
                </div>
                <div>
                  <p className="text-xs text-nuit-400">Nom</p>
                  <p className="text-sm font-medium text-white truncate">{s.name}</p>
                </div>
                <div>
                  <p className="text-xs text-nuit-400">Leads</p>
                  <p className="text-sm text-nuit-200">{s.lead_count}</p>
                </div>
                <div>
                  <p className="text-xs text-nuit-400">Documents</p>
                  <p className="text-sm text-nuit-200">{s.document_count}</p>
                </div>
                <div>
                  <p className="text-xs text-nuit-400">Statut</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_suspended ? 'bg-danger/10 text-danger' : 'bg-emeraude-500/10 text-emeraude-400'}`}>
                    {s.is_suspended ? 'Suspendue' : 'Active'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleToggleSuspend(s)} className="p-2 rounded-lg hover:bg-white/5 text-nuit-400" title={s.is_suspended ? 'Activer' : 'Suspendre'}>
                  {s.is_suspended ? <ToggleLeft size={16} className="text-danger" /> : <ToggleRight size={16} className="text-emeraude-400" />}
                </button>
                <button onClick={() => setShowEdit(s)} className="p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white"><Edit3 size={16} /></button>
                <button onClick={() => handleResetKey(s.id)} className="p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-emeraude-400"><Key size={16} /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-danger/10 text-nuit-400 hover:text-danger"><Trash2 size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSchoolModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {showEdit && (
        <EditSchoolModal
          school={showEdit}
          onClose={() => setShowEdit(null)}
          onSubmit={(data) => handleUpdate(showEdit.id, data)}
        />
      )}

      {newAdminKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setNewAdminKey(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Clé d'administration générée</h2>
            <p className="text-sm text-nuit-300 mb-4">Copiez cette clé et transmettez-la à l'établissement.</p>
            <div className="flex items-center gap-2 bg-nuit-800 rounded-lg p-3 mb-4">
              <code className="flex-1 text-sm text-emeraude-400 break-all">{newAdminKey}</code>
              <button onClick={copyKey} className="p-2 rounded-lg hover:bg-white/5 text-nuit-400">
                {copied ? <Check size={16} className="text-emeraude-400" /> : <Copy size={16} />}
              </button>
            </div>
            <button onClick={() => setNewAdminKey(null)} className="btn-primary w-full">Fermer</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function CreateSchoolModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: SchoolCreate) => Promise<void> }) {
  const [form, setForm] = useState({ id: '', name: '', primary_color: '#6366F1', contact_email: '', logo_url: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ ...form, logo_url: form.logo_url || undefined, contact_email: form.contact_email || undefined });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-6">Nouvelle école</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">ID (slug)</label>
            <input type="text" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className="input-field" placeholder="mon_ecole" required pattern="^[a-z0-9_]+$" />
          </div>
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">Nom</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">Couleur principale</label>
            <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-full rounded-lg cursor-pointer bg-nuit-800 border border-nuit-500" />
          </div>
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">URL du logo</label>
            <input type="text" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">Email de contact</label>
            <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditSchoolModal({ school, onClose, onSubmit }: { school: SchoolAdmin; onClose: () => void; onSubmit: (data: SchoolUpdate) => Promise<void> }) {
  const [form, setForm] = useState({
    name: school.name,
    primary_color: school.primary_color,
    logo_url: school.logo_url || '',
    contact_email: school.contact_email || '',
    nom_directeur: school.nom_directeur || '',
    directeur_fondateur: school.directeur_fondateur || '',
    annee_scolaire_active: school.annee_scolaire_active,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      name: form.name,
      primary_color: form.primary_color,
      logo_url: form.logo_url || null,
      contact_email: form.contact_email || null,
      nom_directeur: form.nom_directeur || null,
      directeur_fondateur: form.directeur_fondateur || null,
      annee_scolaire_active: form.annee_scolaire_active,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-2">Modifier {school.id}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">Nom</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-nuit-300 mb-1.5">Couleur</label>
              <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-full rounded-lg cursor-pointer bg-nuit-800 border border-nuit-500" />
            </div>
            <div>
              <label className="block text-sm text-nuit-300 mb-1.5">Année scolaire</label>
              <input type="text" value={form.annee_scolaire_active} onChange={(e) => setForm({ ...form, annee_scolaire_active: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">Email</label>
            <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">Directeur</label>
            <input type="text" value={form.nom_directeur} onChange={(e) => setForm({ ...form, nom_directeur: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-nuit-300 mb-1.5">Directeur fondateur</label>
            <input type="text" value={form.directeur_fondateur} onChange={(e) => setForm({ ...form, directeur_fondateur: e.target.value })} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
