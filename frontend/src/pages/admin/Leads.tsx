import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Trash2, Download, UserPlus, Loader2, Eye, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { Lead, SchoolClass } from '@/types';
import { formatDate, formatPhone } from '@/lib/utils';
import { toast } from '@/lib/ui';
import { downloadFile } from '@/lib/download';
import { LeadDetailModal } from '@/components/ui/DetailModals';

export default function AdminLeads() {
  const { adminKey, schoolId, school } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [convertModal, setConvertModal] = useState<Lead | null>(null);
  const [convertForm, setConvertForm] = useState({ classe: '', password: '' });
  const [converting, setConverting] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);

  const loadLeads = () => {
    if (!schoolId || !adminKey) return;
    setLoading(true);
    api.get(`/leads/${schoolId}`, { headers: { 'X-Admin-Key': adminKey } })
      .then((res) => setLeads(res.data))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadLeads(); }, [schoolId, adminKey]);
  useEffect(() => { if (schoolId) api.get(`/school/${schoolId}/classes`).then((r) => setSchoolClasses(r.data)).catch(() => {}); }, [schoolId]);

  const handleDelete = async (leadId: string) => {
    try {
      await api.delete(`/leads/${schoolId}/${leadId}`, { headers: { 'X-Admin-Key': adminKey } });
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success('Lead supprimé');
    } catch (err) { toast.error('Erreur lors de la suppression'); }
  };

  const handleConvert = async () => {
    if (!convertModal || !adminKey) return;
    setConverting(true);
    try {
      await api.post(`/student/admin/${schoolId}/convert-lead/${encodeURIComponent(convertModal.phone)}`, {
        classe: convertForm.classe, password: convertForm.password,
      }, { headers: { 'X-Admin-Key': adminKey } });
      setLeads((prev) => prev.filter((l) => l.id !== convertModal.id));
      setConvertModal(null);
      toast.success('Lead converti en élève');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la conversion');
    } finally { setConverting(false); }
  };

  const filtered = leads.filter((l) => l.student_name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Leads</h1>
          <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">{leads.length} inscription{leads.length > 1 ? 's' : ''} — {school?.name}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <button onClick={() => downloadFile(`/exports/schools/${schoolId}/leads/excel`)}
            className="bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-xs sm:text-sm py-2 px-2.5 sm:px-3 flex items-center gap-1">
            <FileSpreadsheet size={13} /> <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => downloadFile(`/exports/schools/${schoolId}/leads/pdf`)}
            className="bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-xs sm:text-sm py-2 px-2.5 sm:px-3 flex items-center gap-1">
            <FileText size={13} /> <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
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
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl text-center py-10 sm:py-12 px-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emeraude-500/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emeraude-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{search ? 'Aucun résultat' : 'Aucun lead'}</h3>
          <p className="text-xs text-nuit-300">Les inscriptions apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filtered.map((lead, i) => (
            <div key={lead.id} className="glass rounded-xl p-3 sm:p-4 hover:border-emeraude-500/30 transition-all duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-white break-words">{lead.student_name}</p>
                  <div className="flex items-center gap-2 text-xs text-nuit-400 mt-0.5 flex-wrap">
                    <span>{formatPhone(lead.phone)}</span>
                    {lead.serie && <span>• {lead.serie}</span>}
                    <span>• {formatDate(lead.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button onClick={() => setDetailLead(lead)} className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 text-nuit-400 hover:text-white transition-all" title="Détails">
                    <Eye size={14} className="sm:w-4" />
                  </button>
                  <button onClick={() => setConvertModal(lead)} className="p-1.5 sm:p-2 rounded-lg hover:bg-emeraude-500/10 text-emeraude-400 transition-all" title="Convertir">
                    <UserPlus size={14} className="sm:w-4" />
                  </button>
                  <button onClick={() => handleDelete(lead.id)} className="p-1.5 sm:p-2 rounded-lg hover:bg-danger/10 text-nuit-400 hover:text-danger transition-all" title="Supprimer">
                    <Trash2 size={14} className="sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailLead && <LeadDetailModal lead={detailLead} open={true} onClose={() => setDetailLead(null)} />}

      {/* Convert modal */}
      {convertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConvertModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative glass rounded-2xl p-5 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base sm:text-xl font-bold text-white mb-1">Convertir en élève</h2>
            <p className="text-sm text-nuit-300 mb-5 sm:mb-6">{convertModal.student_name} — {formatPhone(convertModal.phone)}</p>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Classe</label>
                <select value={convertForm.classe} onChange={(e) => setConvertForm({ ...convertForm, classe: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white text-sm focus:outline-none focus:border-emeraude-500 transition-all">
                  <option value="">Sélectionnez...</option>
                  {schoolClasses.map((c) => (<option key={c.id} value={c.nom_classe}>{c.nom_classe}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Mot de passe</label>
                <input type="password" value={convertForm.password} onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 transition-all"
                  placeholder="Mot de passe initial" />
              </div>
              <div className="flex gap-3 pt-1 sm:pt-2">
                <button onClick={() => setConvertModal(null)} className="flex-1 px-4 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm">Annuler</button>
                <button onClick={handleConvert} disabled={converting}
                  className="flex-1 px-4 py-2.5 bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  {converting && <Loader2 className="w-4 h-4 animate-spin" />} Convertir
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
