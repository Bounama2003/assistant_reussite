import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Search, Trash2, Edit3, Loader2, Check, X, Globe, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { DocumentItem, SchoolCourse, SchoolClass, Professor } from '@/types';
import { toast } from '@/lib/ui';
import MultiSelect from '@/components/ui/MultiSelect';

export default function AdminDocuments() {
  const { adminKey, schoolId } = useAuthStore();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ matiere: '', classes: [] as string[], professeur: '', annee_scolaire: '2025-2026', public: true });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ matiere: '', classe: '', professeur: '' });
  const [courses, setCourses] = useState<SchoolCourse[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);

  const load = () => {
    if (!schoolId || !adminKey) return;
    setLoading(true);
    Promise.all([
      api.get('/documents', { params: { school_id: schoolId }, headers: { 'X-Admin-Key': adminKey } }),
      api.get(`/school/${schoolId}/courses`).catch(() => ({ data: [] })),
      api.get(`/school/${schoolId}/classes`).catch(() => ({ data: [] })),
      api.get(`/professors/professors-list/${schoolId}`, { headers: { 'X-Admin-Key': adminKey } }).catch(() => ({ data: [] })),
    ]).then(([docsRes, coursesRes, classesRes, profsRes]) => {
      setDocuments(docsRes.data); setCourses(coursesRes.data); setClasses(classesRes.data); setProfessors(profsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId, adminKey]);

  const handleUpload = async () => {
    if (!uploadFile || !adminKey) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile); fd.append('school_id', schoolId || ''); fd.append('matiere', uploadForm.matiere);
    fd.append('classe', uploadForm.classes.join(',')); if (uploadForm.professeur) fd.append('professeur', uploadForm.professeur);
    fd.append('annee_scolaire', uploadForm.annee_scolaire); fd.append('public', uploadForm.public ? 'true' : 'false');
    try {
      await api.post('/upload', fd, { headers: { 'X-Admin-Key': adminKey, 'Content-Type': 'multipart/form-data' } });
      setShowUpload(false); setUploadFile(null); setUploadForm({ matiere: '', classes: [], professeur: '', annee_scolaire: '2025-2026', public: true });
                load(); toast.success('Document importé', `${uploadFile.name} ajouté`);
    } catch (err: any) { toast.error(err.response?.data?.detail || "Erreur lors de l'import"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (filename: string) => {
    try {
      await api.delete('/documents', { params: { school_id: schoolId, filename }, headers: { 'X-Admin-Key': adminKey } });
      setDocuments((prev) => prev.filter((d) => d.filename !== filename)); toast.success('Document supprimé');
    } catch (err) { toast.error('Erreur'); }
  };

  const handleEdit = async (filename: string) => {
    try {
      await api.put('/documents/metadata', null, { params: { school_id: schoolId, filename, ...editForm }, headers: { 'X-Admin-Key': adminKey } });
      setEditingFile(null); load(); toast.success('Métadonnées mises à jour');
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase()) || d.matiere.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Documents</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{documents.length} document{documents.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0 flex items-center gap-1">
          <Upload size={14} /> <span className="hidden sm:inline">Télécharger</span><span className="sm:hidden">+</span>
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
          {[1,2,3].map((i) => <div key={i} className="skeleton h-[72px] sm:h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emeraude-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{search ? 'Aucun résultat' : 'Aucun document'}</h3>
          <p className="text-xs text-nuit-300 mb-4">Importez des documents PDF pour alimenter l'IA</p>
          <button onClick={() => setShowUpload(true)}
            className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-sm py-2 px-4 inline-flex items-center gap-1.5">
            <Upload size={14} /> Télécharger
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filtered.map((doc, i) => (
            <div key={doc.filename} className="glass rounded-xl p-3 sm:p-4 hover:border-emeraude-500/30 transition-all duration-200">
              {editingFile === doc.filename ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-nuit-400 mb-0.5">Matière</p>
                      <input type="text" value={editForm.matiere} onChange={(e) => setEditForm({ ...editForm, matiere: e.target.value })}
                        className="w-full px-3 py-2 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-nuit-400 mb-0.5">Classe</p>
                      <input type="text" value={editForm.classe} onChange={(e) => setEditForm({ ...editForm, classe: e.target.value })}
                        className="w-full px-3 py-2 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-nuit-400 mb-0.5">Professeur</p>
                      <input type="text" value={editForm.professeur} onChange={(e) => setEditForm({ ...editForm, professeur: e.target.value })}
                        className="w-full px-3 py-2 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" />
                    </div>
                    <div className="flex items-end gap-1 pb-0.5">
                      <button onClick={() => handleEdit(doc.filename)} className="p-2 rounded-lg hover:bg-emeraude-500/10 text-emeraude-400"><Check size={16} /></button>
                      <button onClick={() => setEditingFile(null)} className="p-2 rounded-lg hover:bg-danger/10 text-danger"><X size={16} /></button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-white break-words">{doc.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-nuit-400 mt-0.5 flex-wrap">
                      <span>{doc.matiere || '-'}</span>
                      {doc.classe && <span>• {doc.classe}</span>}
                      <span className={`inline-flex items-center gap-0.5 ${doc.public !== false ? 'text-emeraude-400' : 'text-amber-400'}`}>
                        • {doc.public !== false ? <Globe size={10} /> : <Lock size={10} />}
                        {doc.public !== false ? 'Public' : 'Privé'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <button onClick={() => { setEditingFile(doc.filename); setEditForm({ matiere: doc.matiere, classe: doc.classe, professeur: doc.professeur }); }}
                      className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white transition-all" title="Modifier">
                      <Edit3 size={14} className="sm:w-4" />
                    </button>
                    <button onClick={() => handleDelete(doc.filename)} className="p-1.5 sm:p-2 rounded-lg hover:bg-danger/10 text-nuit-400 hover:text-danger transition-all" title="Supprimer">
                      <Trash2 size={14} className="sm:w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative glass rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
              <h2 className="text-base sm:text-xl font-bold text-white mb-5 sm:mb-6">Télécharger un document</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Fichier PDF</label>
                <input type="file" accept=".pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emeraude-500/10 file:text-emeraude-400 file:text-sm file:font-medium" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Matière</label>
                <select value={uploadForm.matiere} onChange={(e) => setUploadForm({ ...uploadForm, matiere: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" required>
                  <option value="">Sélectionnez...</option>
                  {courses.map((c) => (<option key={c.id} value={c.nom_cours}>{c.nom_cours}{c.libelle ? ` (${c.libelle})` : ''}</option>))}
                </select>
              </div>
              <MultiSelect label="Classes concernées"
                options={classes.map((c) => ({ value: c.nom_classe, label: c.nom_classe }))}
                selected={uploadForm.classes} onChange={(v) => setUploadForm({ ...uploadForm, classes: v })}
                placeholder="Sélectionnez..." />
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Professeur (optionnel)</label>
                <select value={uploadForm.professeur} onChange={(e) => setUploadForm({ ...uploadForm, professeur: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all">
                  <option value="">Aucun</option>
                  {professors.filter((p) => p.is_active).map((p) => (<option key={p.id} value={p.name}>{p.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Année scolaire</label>
                <input type="text" value={uploadForm.annee_scolaire} onChange={(e) => setUploadForm({ ...uploadForm, annee_scolaire: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs sm:text-sm text-nuit-300">Public</label>
                <button type="button" onClick={() => setUploadForm({ ...uploadForm, public: !uploadForm.public })}
                  className={`relative w-11 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${uploadForm.public ? 'bg-emeraude-500' : 'bg-nuit-500'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white transition-transform ${uploadForm.public ? 'translate-x-5.5 sm:translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-[11px] sm:text-xs text-nuit-400">{uploadForm.public ? 'Accessible à tous' : 'Réservé aux élèves'}</span>
              </div>
              <div className="flex gap-3 pt-1 sm:pt-2">
                <button onClick={() => setShowUpload(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm">Annuler</button>
                <button onClick={handleUpload} disabled={uploading || !uploadFile}
                  className="flex-1 px-4 py-2.5 bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />} Télécharger
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
