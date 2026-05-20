import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, Search, Trash2, Edit3, Loader2, Check, X, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { SchoolClass, Professor } from '@/types';
import { toast } from '@/lib/ui';

export default function AdminClasses() {
  const { adminKey, schoolId } = useAuthStore();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ nom_classe: '', professeur_responsable: '' });
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nom_classe: '', professeur_responsable: '' });

  const load = () => {
    if (!schoolId) return;
    setLoading(true);
    Promise.all([
      api.get(`/school/${schoolId}/classes`).then((r) => setClasses(r.data)).catch(() => {}),
      api.get(`/professors/professors-list/${schoolId}`, { headers: { 'X-Admin-Key': adminKey } })
        .then((r) => setProfessors(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleCreate = async () => {
    if (!createForm.nom_classe.trim() || !adminKey) return;
    setCreating(true);
    try {
      await api.post(`/school/${schoolId}/classes`, {
        nom_classe: createForm.nom_classe.trim(),
        professeur_responsable: createForm.professeur_responsable || undefined,
      }, { headers: { 'X-Admin-Key': adminKey } });
      setShowCreate(false); setCreateForm({ nom_classe: '', professeur_responsable: '' });
      toast.success('Classe ajoutée'); load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur'); }
    finally { setCreating(false); }
  };

  const handleEdit = async () => {
    if (!editId || !adminKey) return;
    try {
      await api.put(`/school/${schoolId}/classes/${editId}`, {
        nom_classe: editForm.nom_classe, professeur_responsable: editForm.professeur_responsable || undefined,
      }, { headers: { 'X-Admin-Key': adminKey } });
      setEditId(null); toast.success('Classe mise à jour'); load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  const handleDelete = async (id: string) => {
    if (!adminKey) return;
    try {
      await api.delete(`/school/${schoolId}/classes/${id}`, { headers: { 'X-Admin-Key': adminKey } });
      setClasses((prev) => prev.filter((c) => c.id !== id)); toast.success('Classe supprimée');
    } catch (err) { toast.error('Erreur lors de la suppression'); }
  };

  const filtered = classes.filter((c) => c.nom_classe.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Classes</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{classes.length} classe{classes.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0 flex items-center gap-1">
          <Plus size={14} /> <span className="hidden sm:inline">Nouvelle</span><span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400 pointer-events-none" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 transition-all"
          placeholder="Rechercher..." />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2 sm:space-y-3">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-[68px] sm:h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-emeraude-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{search ? 'Aucun résultat' : 'Aucune classe'}</h3>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filtered.map((c, i) => (
            <div key={c.id} className="glass rounded-xl p-3 sm:p-4 hover:border-emeraude-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>

                {editId === c.id ? (
                  <>
                    <div className="flex-1 min-w-0 space-y-2">
                      <input type="text" value={editForm.nom_classe} onChange={(e) => setEditForm({ ...editForm, nom_classe: e.target.value })}
                        className="w-full px-3 py-2 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" />
                      <select value={editForm.professeur_responsable} onChange={(e) => setEditForm({ ...editForm, professeur_responsable: e.target.value })}
                        className="w-full px-3 py-2 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all">
                        <option value="">Aucun professeur</option>
                        {professors.filter((p) => p.is_active).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                      </select>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={handleEdit} className="p-1.5 sm:p-2 rounded-lg hover:bg-emeraude-500/10 text-emeraude-400"><Check size={15} /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 sm:p-2 rounded-lg hover:bg-danger/10 text-danger"><X size={15} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-white">{c.nom_classe}</p>
                      <p className="text-xs text-nuit-400 mt-0.5">
                        <span className="text-emeraude-400">Responsable:</span> {c.professeur_nom || 'Aucun'}
                      </p>
                    </div>
                    <div className="flex gap-0.5 sm:gap-1 shrink-0">
                      <button onClick={() => { setEditId(c.id); setEditForm({ nom_classe: c.nom_classe, professeur_responsable: c.professeur_responsable || '' }); }}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white transition-all">
                        <Edit3 size={14} className="sm:w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-danger/10 text-nuit-400 hover:text-danger transition-all">
                        <Trash2 size={14} className="sm:w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative glass rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base sm:text-xl font-bold text-white mb-5 sm:mb-6">Nouvelle classe</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Nom de la classe</label>
                <input type="text" value={createForm.nom_classe} onChange={(e) => setCreateForm({ ...createForm, nom_classe: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 transition-all"
                  placeholder="TS1, 3e..." required />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Professeur responsable</label>
                <select value={createForm.professeur_responsable} onChange={(e) => setCreateForm({ ...createForm, professeur_responsable: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all">
                  <option value="">Aucun</option>
                  {professors.filter((p) => p.is_active).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div className="flex gap-3 pt-1 sm:pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm">Annuler</button>
                <button onClick={handleCreate} disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />} Créer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
