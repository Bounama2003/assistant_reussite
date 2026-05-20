import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, BookOpen, LogOut, Save, Lock, Eye, EyeOff, ArrowLeft, Shield, Globe, Building2, AtSign, School, Camera, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { getInitials } from '@/lib/utils';
import { toast } from '@/lib/ui';

export default function Profile() {
  const { role, student, professor, school, logout, superAdminKey } = useAuthStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setLoading(true);
    try {
      await api.post(`/student/${student.school_id}/${student.id}/change-password`, {
        current_password: currentPassword, new_password: newPassword,
      });
      toast.success('Mot de passe modifié');
      setCurrentPassword(''); setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const displayName = student?.name || professor?.name || '';
  const displayRole = role === 'student' ? 'Élève' : role === 'professor' ? 'Professeur' : role === 'admin' ? 'Administrateur' : role === 'superadmin' ? 'Super Admin' : '';

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-nuit-300 hover:text-white transition-colors">
        <ArrowLeft size={15} /> Retour
      </button>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0f172a] border border-white/5 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-20 h-20 rounded-full bg-[#1e293b] border-2 border-[#11caa0]/30 flex items-center justify-center text-white mb-3 shadow-lg">
            <span className="text-2xl font-bold">{getInitials(displayName || '?')}</span>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#11caa0] text-[#020617] rounded-full flex items-center justify-center shadow cursor-pointer">
              <Camera size={12} />
            </div>
          </div>
          <h1 className="text-lg font-bold text-white">{displayName}</h1>
          <p className="text-sm text-nuit-300 capitalize">{displayRole}</p>
          {school && <p className="text-xs text-nuit-400 mt-0.5">{school.name}</p>}
        </div>

        {role === 'student' && student && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#0f172a] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-white">{student.classe || student.serie || '-'}</span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Classe</span>
            </div>
            <div className="bg-[#0f172a] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-white">{student.serie || '-'}</span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Série</span>
            </div>
            <div className="bg-[#0f172a] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className={`text-lg font-bold ${student.is_active ? 'text-emeraude-400' : 'text-red-400'}`}>
                {student.is_active ? 'Actif' : 'Inactif'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Statut</span>
            </div>
          </div>
        )}

        <div className="space-y-0">
          {role === 'student' && student && (
            <>
              <Field icon={Phone} label="Téléphone" value={student.phone} />
              <Field icon={BookOpen} label="Classe" value={student.classe || student.serie || 'Non définie'} />
              <Field icon={School} label="Série" value={student.serie || 'Non définie'} />
              <Field icon={User} label="Statut" value={student.is_active ? 'Actif' : 'Inactif'} valueClass={student.is_active ? 'text-emeraude-400' : 'text-red-400'} />
            </>
          )}
          {role === 'professor' && professor && (
            <>
              <Field icon={Phone} label="Téléphone" value={professor.phone} />
              <Field icon={BookOpen} label="Matières" value={professor.matieres?.join(', ') || 'Aucune'} />
              <Field icon={School} label="Classes" value={professor.classes?.join(', ') || 'Aucune'} />
              <Field icon={Shield} label="Statut" value={professor.is_active ? 'Actif' : 'Inactif'} valueClass={professor.is_active ? 'text-emeraude-400' : 'text-red-400'} />
            </>
          )}
          {role === 'admin' && (
            <>
              <Field icon={School} label="École" value={school?.name || ''} />
              <Field icon={Building2} label="Code école" value={school?.id || ''} />
              <Field icon={Shield} label="Rôle" value="Administrateur" />
            </>
          )}
          {role === 'superadmin' && (
            <>
              <Field icon={Globe} label="Rôle" value="Super Administrateur" />
              <Field icon={AtSign} label="Clé" value={superAdminKey ? `${superAdminKey.slice(0, 12)}...` : ''} />
            </>
          )}

          <button onClick={handleLogout}
            className="w-full flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3.5 mt-4 active:bg-red-500/10 transition-colors cursor-pointer text-red-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-medium">Déconnexion</span>
            </div>
            <LogOut size={16} className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Password change */}
      {role === 'student' && student && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-xl p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emeraude-400" /> Mot de passe
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm text-nuit-300 mb-1">Mot de passe actuel</label>
              <div className="relative">
                <input type={showPwd.current ? 'text' : 'password'} value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 focus:ring-1 focus:ring-emeraude-500/50 transition-all pr-10"
                  required />
                <button type="button" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nuit-400 hover:text-white transition-colors">
                  {showPwd.current ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-nuit-300 mb-1">Nouveau mot de passe</label>
              <div className="relative">
                <input type={showPwd.new ? 'text' : 'password'} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 focus:ring-1 focus:ring-emeraude-500/50 transition-all pr-10"
                  required minLength={6} />
                <button type="button" onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nuit-400 hover:text-white transition-colors">
                  {showPwd.new ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full sm:w-auto bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors disabled:opacity-50 px-5 py-2.5 text-sm flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-nuit-900 border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
              Enregistrer
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value, valueClass }: { icon: React.ElementType; label: string; value: string; valueClass?: string }) {
  return (
    <button className="w-full flex items-center justify-between bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3.5 mb-2 active:bg-[#1e293b] transition-colors cursor-pointer text-left">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#11caa0]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{label}</p>
          <p className={`text-sm text-white truncate ${valueClass || ''}`}>{value}</p>
        </div>
      </div>
      <ChevronRight className="text-slate-500 w-4 h-4 shrink-0" />
    </button>
  );
}
