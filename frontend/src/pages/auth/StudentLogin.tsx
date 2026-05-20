import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Phone, Lock, School, Eye, EyeOff, ArrowRight, Brain } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { Student } from '@/types';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { setStudent } = useAuthStore();
  const [searchParams] = useSearchParams();
  const schoolFromUrl = searchParams.get('school') || sessionStorage.getItem('school_code') || '';
  const [form, setForm] = useState({ school_id: schoolFromUrl, phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const codePreFilled = !!schoolFromUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.phone.startsWith('+221') || form.phone.length !== 13) {
      setError('Le numéro doit être au format +221XXXXXXXXX');
      setLoading(false);
      return;
    }

    try {
      const studentRes = await api.post<Student>('/student/login', {
        phone: form.phone,
        password: form.password,
        school_id: form.school_id,
      });
      const schoolRes = await api.get(`/school/${form.school_id}`);
      setStudent(studentRes.data, schoolRes.data);
      navigate('/chat');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Numéro ou mot de passe incorrect');
      } else if (err.response?.status === 404) {
        setError('École introuvable');
      } else {
        setError(err.response?.data?.detail || 'Erreur de connexion');
      }
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
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Connexion Élève</h1>
          <p className="text-nuit-300 text-sm mt-1">Accédez à votre espace de révision</p>
        </div>

        <div className="glass rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
            {codePreFilled ? (
              <div className="flex items-center gap-2 bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3">
                <School className="w-4 h-4 text-[#11caa0] shrink-0" />
                <span className="text-sm text-slate-300">
                  École : <span className="text-white font-mono tracking-wider">{form.school_id}</span>
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-nuit-300 mb-1.5">Code de l'école</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
                  <input
                    type="text"
                    value={form.school_id}
                    onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                    className="input-field pl-10!"
                    placeholder="demo_ecole"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-nuit-300 mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field pl-10!"
                  placeholder="+221771234567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-nuit-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10! pr-10!"
                  placeholder="Votre mot de passe"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-nuit-400 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/5 p-3 rounded-lg text-center">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-nuit-900 border-t-transparent rounded-full animate-spin" /> : <LogIn size={16} />}
              Se connecter
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-nuit-600/50 space-y-3 text-center text-sm">
            <Link to="/" className="text-nuit-400 hover:text-white transition-colors block">Retour à l'accueil</Link>
            {form.school_id && (
              <Link to={`/lead/${form.school_id}`} className="text-emeraude-400 hover:text-emeraude-300 transition-colors flex items-center justify-center gap-1">
                Accéder en tant que prospect <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
