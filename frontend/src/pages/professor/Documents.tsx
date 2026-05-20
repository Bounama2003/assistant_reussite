import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Trash2, Loader2, Globe, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { ProfessorDocumentStat, SchoolCourse, SchoolClass, Professor } from '@/types';
import { toast } from '@/lib/ui';
import MultiSelect from '@/components/ui/MultiSelect';

export default function ProfessorDocuments() {
  const { professorKey } = useAuthStore();
  const [documents, setDocuments] = useState<ProfessorDocumentStat[]>([]);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [allCourses, setAllCourses] = useState<SchoolCourse[]>([]);
  const [allClasses, setAllClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ matiere: '', classes: [] as string[], annee_scolaire: '2025-2026', public: true });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!professorKey) return;
    Promise.all([
      api.get('/professor/dashboard/documents', { headers: { 'X-Professor-Key': professorKey } }),
      api.get('/professor/me', { headers: { 'X-Professor-Key': professorKey } }),
    ]).then(([docsRes, profRes]) => {
      setDocuments(docsRes.data);
      const prof = profRes.data as Professor;
      setProfessor(prof);
      return Promise.all([
        api.get(`/school/${prof.school_id}/courses`).catch(() => ({ data: [] })),
        api.get(`/school/${prof.school_id}/classes`).catch(() => ({ data: [] })),
      ]);
    }).then(([coursesRes, classesRes]) => {
      setAllCourses(coursesRes?.data || []);
      setAllClasses(classesRes?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [professorKey]);

  const myMatieres = professor?.matieres || [];
  const myClasses = professor?.classes || [];
  const filteredCourses = allCourses.filter((c) => myMatieres.includes(c.nom_cours));
  const filteredClasses = allClasses.filter((c) => myClasses.includes(c.nom_classe));

  const handleUpload = async () => {
    if (!uploadFile || !professorKey) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('matiere', uploadForm.matiere);
    formData.append('classe', uploadForm.classes.join(','));
    formData.append('annee_scolaire', uploadForm.annee_scolaire);
    formData.append('public', uploadForm.public ? 'true' : 'false');
    try {
      await api.post('/professor/upload', formData, {
        headers: { 'X-Professor-Key': professorKey, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploadé');
      setShowUpload(false);
      setUploadFile(null);
      setUploadForm({ matiere: '', classes: [], annee_scolaire: '2025-2026', public: true });
      window.location.reload();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : "Erreur lors de l'upload");
    } finally { setUploading(false); }
  };

  const handleDelete = async (filename: string) => {
    try {
      await api.delete(`/professor/documents/${encodeURIComponent(filename)}`, { headers: { 'X-Professor-Key': professorKey } });
      setDocuments((prev) => prev.filter((d) => d.filename !== filename));
      toast.success('Document supprimé');
    } catch (err) { toast.error('Erreur lors de la suppression'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mes documents</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{documents.length} document{documents.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0 flex items-center gap-1">
          <Upload size={14} /> <span className="hidden sm:inline">Uploader</span><span className="sm:hidden">+</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-[68px] sm:h-20 w-full rounded-xl" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-emeraude-400" />
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-white mb-1">Aucun document</h3>
          <p className="text-xs sm:text-sm text-nuit-300 mb-4">Uploader vos documents PDF</p>
          <button onClick={() => setShowUpload(true)}
            className="bg-emeraude-500 text-nuit-900 font-semibold rounded-lg hover:bg-emeraude-400 transition-colors text-sm py-2 px-4 inline-flex items-center gap-1.5">
            <Upload size={14} /> Uploader
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {documents.map((doc, i) => (
            <div key={doc.filename}
              className="glass rounded-xl p-3 sm:p-4 hover:border-emeraude-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-white truncate">{doc.filename}</p>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-nuit-400 mt-0.5 flex-wrap">
                    <span>{doc.matiere}</span>
                    <span>• {doc.classe}</span>
                    <span>• {doc.query_count} question{doc.query_count > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(doc.filename)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-danger/10 text-nuit-400 hover:text-danger transition-all shrink-0">
                  <Trash2 size={14} className="sm:w-4" />
                </button>
              </div>
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
            <h2 className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6">Uploader un document</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Fichier PDF</label>
                <input type="file" accept=".pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emeraude-500/10 file:text-emeraude-400 file:text-sm file:font-medium" />
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Matière</label>
                {filteredCourses.length > 0 ? (
                  <select value={uploadForm.matiere} onChange={(e) => setUploadForm({ ...uploadForm, matiere: e.target.value })}
                    className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" required>
                    <option value="">Sélectionnez...</option>
                    {filteredCourses.map((c) => (
                      <option key={c.id} value={c.nom_cours}>{c.nom_cours}{c.libelle ? ` (${c.libelle})` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={uploadForm.matiere} onChange={(e) => setUploadForm({ ...uploadForm, matiere: e.target.value })}
                    className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 transition-all"
                    placeholder="Saisissez la matière..." required />
                )}
              </div>

              <MultiSelect label="Classes concernées"
                options={filteredClasses.map((c) => ({ value: c.nom_classe, label: c.nom_classe }))}
                selected={uploadForm.classes} onChange={(v) => setUploadForm({ ...uploadForm, classes: v })}
                placeholder={filteredClasses.length > 0 ? 'Sélectionnez...' : 'Aucune classe configurée'} />

              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Année scolaire</label>
                <input type="text" value={uploadForm.annee_scolaire} onChange={(e) => setUploadForm({ ...uploadForm, annee_scolaire: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all" />
              </div>

              <div className="flex items-center gap-3 py-1">
                <label className="text-xs sm:text-sm text-nuit-300">Document public</label>
                <button type="button" onClick={() => setUploadForm({ ...uploadForm, public: !uploadForm.public })}
                  className={`relative w-11 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${uploadForm.public ? 'bg-emeraude-500' : 'bg-nuit-500'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white transition-transform ${uploadForm.public ? 'translate-x-5.5 sm:translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-[11px] sm:text-xs text-nuit-400 flex items-center gap-1">
                  {uploadForm.public ? <Globe size={12} /> : <Lock size={12} />}
                  {uploadForm.public ? 'Accessible à tous' : 'Réservé aux élèves'}
                </span>
              </div>

              <div className="flex gap-3 pt-1 sm:pt-2">
                <button onClick={() => setShowUpload(false)} className="flex-1 px-4 py-2.5 sm:py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm">Annuler</button>
                <button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadForm.matiere || uploadForm.classes.length === 0}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  title={!uploadFile ? 'Sélectionnez un fichier' : !uploadForm.matiere ? 'Sélectionnez une matière' : uploadForm.classes.length === 0 ? 'Sélectionnez au moins une classe' : ''}>
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />} Uploader
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
