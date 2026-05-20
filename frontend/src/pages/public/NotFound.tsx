import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Brain } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-nuit-900 p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-emeraude-500/5 via-transparent to-transparent" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center mx-auto mb-8">
          <Brain className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page introuvable</h2>
        <p className="text-nuit-300 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Retour
          </button>
          <button onClick={() => navigate('/')} className="btn-primary flex items-center gap-2">
            <Home size={16} /> Accueil
          </button>
        </div>
      </motion.div>
    </div>
  );
}
