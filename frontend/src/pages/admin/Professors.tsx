import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Key, UserCheck, Loader2, Copy, Check, Eye } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { Professor, SchoolCourse, SchoolClass } from '@/types';
import { toast } from '@/lib/ui';
import { ProfessorDetailModal } from '@/components/ui/DetailModals';
import MultiSelect from '@/components/ui/MultiSelect';

export default function AdminProfessors() {
  const { adminKey, schoolId } = useAuthStore();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<SchoolCourse[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detailProfessor, setDetailProfessor] = useState<Professor | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', matieres: [] as string[], classes: [] as string[] });
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    if (!schoolId || !adminKey) return;
    setLoading(true);
    Promise.all([
      api.get(`/professors/professors-list/${schoolId}`, { headers: { 'X-Admin-Key': adminKey } }),
      api.get(`/school/${schoolId}/courses`).catch(() => ({ data: [] })),
      api.get(`/school/${schoolId}/classes`).catch(() => ({ data: [] })),
    ]).then(([profRes, coursesRes, classesRes]) => {
      setProfessors(profRes.data); setCourses(coursesRes.data); setClasses(classesRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId, adminKey]);

  const handleCreate = async () => {
    if (!adminKey) return;
    setCreating(true);
    try {
      const res = await api.post<Professor>(`/professors/school/${schoolId}`, {
        name: createForm.name, phone: createForm.phone, matieres: createForm.matieres, classes: createForm.classes, school_id: schoolId || '',
      }, { headers: { 'X-Admin-Key': adminKey } });
      setProfessors((prev) => [...prev, res.data]);
      setShowCreate(false); setCreateForm({ name: '', phone: '', matieres: [], classes: [] });
      toast.success('Professeur créé');
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur'); }
    finally { setCreating(false); }
  };

  const handleResetKey = async (professorId: string) => {
    if (!adminKey) return;
    try {
      const res = await api.post(`/professors/${professorId}/reset-key`, null, { params: { school_id: schoolId }, headers: { 'X-Admin-Key': adminKey } });
      setNewKey(res.data.professor_key); setCopied(false); load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  const copyKey = () => { if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  const filtered = professors.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Professeurs</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{professors.length} professeur{professors.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0 flex items-center gap-1">
          <Plus size={14} /> <span className="hidden sm:inline">Ajouter</span><span className="sm:hidden">+</span>
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
          {[1,2,3].map((i) => <div key={i} className="skeleton h-[84px] sm:h-24 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emeraude-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{search ? 'Aucun résultat' : 'Aucun professeur'}</h3>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filtered.map((p, i) => (
            <div key={p.id} className="glass rounded-xl p-3 sm:p-4 hover:border-emeraude-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-base font-medium text-white break-words">{p.name}</p>
                  </div>
                  <p className="text-xs text-nuit-400 mt-0.5">{p.phone}</p>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-[40px] sm:max-h-[48px] overflow-hidden">
                    {(p.matieres || []).slice(0, 4).map((m) => (
                      <span key={m} className="text-[10px] sm:text-xs bg-emeraude-500/10 text-emeraude-400 px-1.5 py-0.5 rounded whitespace-nowrap">{m}</span>
                    ))}
                    {(p.classes || []).slice(0, 4).map((c) => (
                      <span key={c} className="text-[10px] sm:text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded whitespace-nowrap">{c}</span>
                    ))}
                    {(p.matieres || []).length + (p.classes || []).length > 8 && (
                      <span className="text-[10px] text-nuit-400">+{(p.matieres || []).length + (p.classes || []).length - 8}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button onClick={() => setDetailProfessor(p)} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white transition-all" title="Détails">
                    <Eye size={14} className="sm:w-4" />
                  </button>
                  <button onClick={() => handleResetKey(p.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-emeraude-500/10 text-emeraude-400 transition-all" title="Nouvelle clé">
                    <Key size={14} className="sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailProfessor && <ProfessorDetailModal professor={detailProfessor} open={true} onClose={() => setDetailProfessor(null)} />}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative glass rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base sm:text-xl font-bold text-white mb-5 sm:mb-6">Nouveau professeur</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Nom</label>
                <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" required />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Téléphone</label>
                <input type="tel" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 transition-all" required />
              </div>
              <MultiSelect label="Matières"
                options={courses.map((c) => ({ value: c.nom_cours, label: c.libelle ? `${c.nom_cours} (${c.libelle})` : c.nom_cours }))}
                selected={createForm.matieres} onChange={(v) => setCreateForm({ ...createForm, matieres: v })}
                placeholder="Sélectionnez..." />
              <MultiSelect label="Classes"
                options={classes.map((c) => ({ value: c.nom_classe, label: c.nom_classe }))}
                selected={createForm.classes} onChange={(v) => setCreateForm({ ...createForm, classes: v })}
                placeholder="Sélectionnez..." />
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

      {/* Key modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNewKey(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative glass rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base sm:text-xl font-bold text-white mb-1">Nouvelle clé générée</h2>
            <p className="text-xs sm:text-sm text-nuit-300 mb-4">Copiez cette clé et transmettez-la au professeur.</p>
            <div className="flex items-center gap-2 bg-nuit-800 rounded-xl p-3 sm:p-4 mb-4">
              <code className="flex-1 text-xs sm:text-sm text-emeraude-400 break-all">{newKey}</code>
              <button onClick={copyKey} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400">
                {copied ? <Check size={15} className="text-emeraude-400" /> : <Copy size={15} />}
              </button>
            </div>
            <button onClick={() => setNewKey(null)} className="w-full bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors py-2.5 text-sm">Fermer</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
