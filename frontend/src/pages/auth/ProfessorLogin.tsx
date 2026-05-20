import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Key, School, UserCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { Professor } from '@/types';

export default function ProfessorLogin() {
  const navigate = useNavigate();
  const { setProfessor } = useAuthStore();
  const [searchParams] = useSearchParams();
  const schoolFromUrl = searchParams.get('school') || sessionStorage.getItem('school_code') || '';
  const [schoolId, setSchoolId] = useState(schoolFromUrl);
  const [professorKey, setProfessorKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codePreFilled = !!schoolFromUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId.trim() || !professorKey.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<Professor>('/professor/login-key', {
        professor_key: professorKey,
        school_id: schoolId,
      });
      setProfessor(res.data);
      navigate('/professor/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Clé invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nuit-900 p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-emeraude-500/5 via-transparent to-transparent" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Espace Professeur</h1>
          <p className="text-nuit-300 text-sm mt-1">Connectez-vous avec votre clé</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {codePreFilled ? (
              <div className="flex items-center gap-2 bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3">
                <School className="w-4 h-4 text-[#11caa0] shrink-0" />
                <span className="text-sm text-slate-300">
                  École : <span className="text-white font-mono tracking-wider">{schoolId}</span>
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-nuit-300 mb-1.5">Code de l'école</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
                  <input
                    type="text"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    className="input-field pl-10!"
                    placeholder="demo_ecole"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-nuit-300 mb-1.5">Clé professeur</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
                <input
                  type="password"
                  value={professorKey}
                  onChange={(e) => setProfessorKey(e.target.value)}
                  className="input-field pl-10!"
                  placeholder="professor-xxx-..."
                  required
                />
              </div>
            </div>

            {error && <div className="text-sm text-danger bg-danger/5 p-3 rounded-lg text-center">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-nuit-900 border-t-transparent rounded-full animate-spin" /> : <LogIn size={16} />}
              Se connecter
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-nuit-600/50 text-center">
            <Link to="/" className="text-sm text-nuit-400 hover:text-white transition-colors">Retour à l'accueil</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
