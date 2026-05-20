import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Key, Shield, Brain, Globe } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { setSuperAdmin } = useAuthStore();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.get('/admin/schools', { headers: { 'X-Super-Admin-Key': key } });
      setSuperAdmin(key);
      navigate('/superadmin/schools');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Clé super-admin invalide');
      } else {
        setError('Erreur de connexion');
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
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Super Administration</h1>
          <p className="text-nuit-300 text-sm mt-1">Gestion multi-établissements</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-nuit-300 mb-1.5">Clé Super Admin</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="input-field pl-10!"
                  placeholder="Votre clé super-admin"
                  required
                />
              </div>
            </div>

            {error && <div className="text-sm text-danger bg-danger/5 p-3 rounded-lg text-center">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-nuit-900 border-t-transparent rounded-full animate-spin" /> : <LogIn size={16} />}
              Accéder
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
