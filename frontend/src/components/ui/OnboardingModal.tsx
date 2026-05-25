import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, MessageSquare, GraduationCap, BookOpen, Upload, BarChart3, School, Users, ArrowRight } from 'lucide-react';
import { useAuthStore, type AuthRole } from '@/stores/authStore';

const onboardingContent: Record<string, { title: string; icon: React.ElementType; steps: Array<{ icon: React.ElementType; title: string; desc: string }> }> = {
  student: {
    title: 'Bienvenue sur Assistant Réussite',
    icon: Brain,
    steps: [
      { icon: MessageSquare, title: 'Posez vos questions', desc: 'Discutez avec l\'assistant IA qui répond en se basant sur vos cours.' },
      { icon: Brain, title: 'Testez vos connaissances', desc: 'Créez des quiz interactifs à partir de vos cours pour vous entraîner.' },
      { icon: BookOpen, title: 'Suivez votre progression', desc: 'Consultez l\'historique de vos conversations et quiz.' },
    ],
  },
  professor: {
    title: 'Espace Professeur',
    icon: GraduationCap,
    steps: [
      { icon: Upload, title: 'Publiez vos cours', desc: 'Importez des documents PDF pour alimenter l\'IA avec votre contenu pédagogique.' },
      { icon: MessageSquare, title: 'Suivez les questions', desc: 'Consultez les questions posées par vos élèves et identifiez les difficultés.' },
      { icon: BarChart3, title: 'Analysez les statistiques', desc: 'Visualisez les performances et les sujets les plus demandés.' },
    ],
  },
  admin: {
    title: 'Espace Administration',
    icon: School,
    steps: [
      { icon: Users, title: 'Gérez vos leads et élèves', desc: 'Convertissez les leads en élèves, gérez les comptes et les classes.' },
      { icon: GraduationCap, title: 'Gérez les professeurs', desc: 'Créez des comptes professeurs et assignez-leur des matières et classes.' },
      { icon: Upload, title: 'Publiez des documents', desc: 'Importez les cours, programmes et exercices pour alimenter l\'IA.' },
    ],
  },
  superadmin: {
    title: 'Super Administration',
    icon: School,
    steps: [
      { icon: School, title: 'Gérez les écoles', desc: 'Créez, modifiez et suspendez des établissements.' },
      { icon: BarChart3, title: 'Statistiques globales', desc: 'Consultez les données agrégées de tous les établissements.' },
      { icon: Users, title: 'Gérez les accès', desc: 'Attribuez les clés d\'administration aux écoles.' },
    ],
  },
};

export default function OnboardingModal() {
  const { role } = useAuthStore();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('onboarding-dismissed') === 'true';
  });

  if (!role || !onboardingContent[role] || dismissed) return null;

  const content = onboardingContent[role];

  const handleDismiss = () => {
    sessionStorage.setItem('onboarding-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleDismiss} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative glass rounded-2xl p-5 sm:p-8 max-w-lg w-full mx-4 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center shrink-0">
              <content.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-white leading-tight">{content.title}</h2>
              <p className="text-xs sm:text-sm text-nuit-300 mt-0.5">Découvrez les fonctionnalités</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {content.steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl glass-light"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emeraude-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-emeraude-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-5 h-5 rounded-full bg-emeraude-500 text-nuit-900 text-[10px] sm:text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <h3 className="text-sm sm:font-semibold text-white">{step.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-nuit-300 mt-0.5 sm:mt-1">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button onClick={handleDismiss} className="btn-primary w-full flex items-center justify-center gap-2">
            C'est parti ! <ArrowRight size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
