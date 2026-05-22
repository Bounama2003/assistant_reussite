import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Key, School, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAdmin } = useAuthStore();
  const [searchParams] = useSearchParams();
  const schoolFromUrl = searchParams.get('school') || sessionStorage.getItem('school_code') || '';
  const adminKeyFromStorage = sessionStorage.getItem('admin_key') || '';
  if (adminKeyFromStorage) sessionStorage.removeItem('admin_key');
  const [form, setForm] = useState({ school_id: schoolFromUrl, admin_key: adminKeyFromStorage });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codePreFilled = !!schoolFromUrl;
  const keyPreFilled = !!adminKeyFromStorage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const schoolRes = await api.get(`/school/${form.school_id}`);
      const schoolId = schoolRes.data.id || form.school_id;

      // /stats/{id} validates X-Admin-Key and returns 403 on mismatch
      await api.get(`/stats/${schoolId}`, {
        headers: { 'X-Admin-Key': form.admin_key },
      });

      setAdmin(form.admin_key, schoolRes.data);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) setError('École introuvable');
      else if (status === 403) setError('Clé admin invalide');
      else setError('Vérifiez vos identifiants');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nuit-900 p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-emeraude-500/5 via-transparent to-transparent pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm sm:max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Administration</h1>
          <p className="text-sm text-nuit-300 mt-0.5">Connectez-vous à votre établissement</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {codePreFilled ? (
              <div className="flex items-center gap-2 bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3">
                <School className="w-4 h-4 text-[#11caa0] shrink-0" />
                <span className="text-sm text-slate-300">
                  École : <span className="text-white font-mono tracking-wider">{form.school_id}</span>
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Code de l'école</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400 pointer-events-none" />
                  <input type="text" value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 focus:ring-1 focus:ring-emeraude-500/50 transition-all"
                    placeholder="demo_ecole" required />
                </div>
              </div>
            )}

            {keyPreFilled ? (
              <div className="flex items-center gap-2 bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3">
                <Key className="w-4 h-4 text-[#ff9f0a] shrink-0" />
                <span className="text-sm text-slate-300">
                  Clé : <span className="text-[#ff9f0a] font-mono text-xs tracking-wider">{form.admin_key.slice(0, 20)}...</span>
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs sm:text-sm text-nuit-300 mb-1 sm:mb-1.5">Clé d'administration</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400 pointer-events-none" />
                  <input type="password" value={form.admin_key} onChange={(e) => setForm({ ...form, admin_key: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-nuit-800 border border-nuit-500 rounded-xl text-white placeholder-nuit-400 text-sm focus:outline-none focus:border-emeraude-500 focus:ring-1 focus:ring-emeraude-500/50 transition-all"
                    placeholder="••••••••••••" required />
                </div>
              </div>
            )}

            {error && <div className="text-xs sm:text-sm text-danger bg-danger/5 p-3 rounded-xl text-center">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-emeraude-500 text-nuit-900 font-semibold rounded-xl hover:bg-emeraude-400 transition-colors disabled:opacity-50 py-2.5 sm:py-3 text-sm flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-nuit-900 border-t-transparent rounded-full animate-spin" /> : <LogIn size={16} />}
              Se connecter
            </button>
          </form>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-nuit-600/50 text-center">
            <Link to="/" className="text-sm text-nuit-400 hover:text-white transition-colors">Retour à l'accueil</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
