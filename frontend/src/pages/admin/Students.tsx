import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, ToggleLeft, ToggleRight, Edit3, Users, User, AlertCircle, Eye } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { Student, SchoolClass } from '@/types';
import { formatPhone } from '@/lib/utils';
import { toast } from '@/lib/ui';
import { downloadFile } from '@/lib/download';
import { StudentDetailModal } from '@/components/ui/DetailModals';

export default function AdminStudents() {
  const { adminKey, schoolId } = useAuthStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ classe: '', password: '', is_active: true });
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);

  const load = () => {
    if (!schoolId || !adminKey) {
      setLoadError('Authentification manquante. Reconnectez-vous.');
      return;
    }
    setLoading(true); setLoadError(null);
    api.get(`/student/admin/${schoolId}/students`, { headers: { 'X-Admin-Key': adminKey } })
      .then((res) => setStudents(res.data))
      .catch((err) => {
        const msg = err.response?.data?.detail || err.message || 'Erreur';
        setLoadError(msg); toast.error('Erreur', msg);
      }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId, adminKey]);
  useEffect(() => { if (schoolId) api.get(`/school/${schoolId}/classes`).then((r) => setSchoolClasses(r.data)).catch(() => {}); }, [schoolId]);

  const handleEdit = async () => {
    if (!editModal || !adminKey) return;
    try {
      await api.put(`/student/admin/${schoolId}/students/${editModal.id}`, {
        classe: editForm.classe, password: editForm.password || undefined, is_active: editForm.is_active,
      }, { headers: { 'X-Admin-Key': adminKey } });
      setEditModal(null); load(); toast.success('Élève mis à jour');
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  const toggleActive = async (student: Student) => {
    if (!adminKey) return;
    try {
      await api.put(`/student/admin/${schoolId}/students/${student.id}`, { is_active: !student.is_active }, { headers: { 'X-Admin-Key': adminKey } });
      load();
    } catch (err) { console.error(err); }
  };

  const filtered = students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Élèves</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{students.length} élève{students.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => downloadFile(`/exports/schools/${schoolId}/students/excel`)}
          className="bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0 flex items-center gap-1.5">
          <Download size={14} /> Excel
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
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-[72px] sm:h-20 w-full rounded-xl" />)}
        </div>
      ) : loadError ? (
        <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-5 h-5 text-danger" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Erreur de chargement</h3>
          <p className="text-xs text-nuit-300 mb-4">{loadError}</p>
          <button onClick={load} className="bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm py-2 px-4">Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emeraude-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{search ? 'Aucun résultat' : 'Aucun élève'}</h3>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filtered.map((s, i) => (
            <div key={s.id} className="glass rounded-xl p-3 sm:p-4 hover:border-emeraude-500/30 transition-all duration-200">
              {/* Main row */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-base font-medium text-white break-words">{s.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${s.is_active ? 'bg-emeraude-500/10 text-emeraude-400' : 'bg-danger/10 text-danger'}`}>
                      {s.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-nuit-400 mt-0.5 flex-wrap">
                    <span>{formatPhone(s.phone)}</span>
                    {s.classe && <span>• {s.classe}</span>}
                    {s.serie && <span>• {s.serie}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button onClick={() => setDetailStudent(s)} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white transition-all" title="Détails">
                    <Eye size={14} className="sm:w-4" />
                  </button>
                  <button onClick={() => toggleActive(s)} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400 transition-all" title={s.is_active ? 'Désactiver' : 'Activer'}>
                    {s.is_active ? <ToggleRight size={14} className="sm:w-4 text-emeraude-400" /> : <ToggleLeft size={14} className="sm:w-4" />}
                  </button>
                  <button onClick={() => { setEditModal(s); setEditForm({ classe: s.classe || '', password: '', is_active: s.is_active }); }}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white transition-all" title="Modifier">
                    <Edit3 size={14} className="sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailStudent && <StudentDetailModal student={detailStudent} open={true} onClose={() => setDetailStudent(null)} />}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative glass rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6">Modifier {editModal.name}</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Classe</label>
                <select value={editForm.classe} onChange={(e) => setEditForm({ ...editForm, classe: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all">
                  <option value="">Aucune</option>
                  {schoolClasses.map((c) => (<option key={c.id} value={c.nom_classe}>{c.nom_classe}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Nouveau mot de passe (optionnel)</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 transition-all"
                  placeholder="Laisser vide pour ne pas changer" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-nuit-300">Actif</label>
                <button onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}>
                  {editForm.is_active ? <ToggleRight className="text-emeraude-400" size={22} /> : <ToggleLeft className="text-nuit-400" size={22} />}
                </button>
              </div>
              <div className="flex gap-3 pt-1 sm:pt-2">
                <button onClick={() => setEditModal(null)} className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm">Annuler</button>
                <button onClick={handleEdit} className="flex-1 px-4 py-2.5 bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors text-sm">Enregistrer</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
