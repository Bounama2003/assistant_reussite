import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Brain, MessageSquare, BookOpen, GraduationCap, Upload, BarChart3, School, Users, UserCircle, Layers, FileText, Bell, Shield } from 'lucide-react';

interface GuideSection {
  icon: React.ElementType;
  title: string;
  items: string[];
}

const guideContent: Record<string, { title: string; icon: React.ElementType; sections: GuideSection[] }> = {
  student: {
    title: 'Guide Utilisateur — Élève',
    icon: Brain,
    sections: [
      { icon: MessageSquare, title: 'Chat IA', items: [
        'Posez des questions sur n\'importe quelle matière',
        'L\'assistant répond en se basant sur les cours de votre école',
        'Les sources des réponses sont citées et consultables',
        'L\'historique de vos conversations est sauvegardé',
      ]},
      { icon: Brain, title: 'Quiz', items: [
        'Générez des quiz automatiquement depuis vos cours',
        'Répondez aux QCM et obtenez une correction instantanée',
        'Suivez votre progression dans le temps',
      ]},
      { icon: BookOpen, title: 'Sessions', items: [
        'Consultez l\'historique de vos conversations et quiz',
        'Exportez vos échanges en PDF ou TXT',
      ]},
      { icon: UserCircle, title: 'Profil', items: [
        'Modifiez vos informations personnelles',
        'Gérez vos préférences de compte',
      ]},
    ],
  },
  professor: {
    title: 'Guide Utilisateur — Professeur',
    icon: GraduationCap,
    sections: [
      { icon: Upload, title: 'Publier des cours', items: [
        'Importez des documents PDF (cours, exercices, corrigés)',
        'Les documents sont automatiquement indexés par l\'IA',
        'Les élèves peuvent poser des questions sur ces documents',
      ]},
      { icon: MessageSquare, title: 'Questions des élèves', items: [
        'Consultez les questions posées par vos élèves',
        'Identifiez les difficultés récurrentes',
        'Suivez les sujets les plus demandés',
      ]},
      { icon: Bell, title: 'Notifications', items: [
        'Recevez des alertes sur l\'activité de vos élèves',
        'Restez informé des nouvelles questions posées',
      ]},
    ],
  },
  admin: {
    title: 'Guide Utilisateur — Administrateur',
    icon: School,
    sections: [
      { icon: Users, title: 'Leads & Élèves', items: [
        'Consultez et convertissez les leads en élèves',
        'Gérez les comptes élèves (création, suspension)',
        'Attribuez les classes et niveaux aux élèves',
      ]},
      { icon: UserCircle, title: 'Professeurs', items: [
        'Créez des comptes professeurs',
        'Assignez les matières et classes aux professeurs',
        'Gérez les accès et permissions',
      ]},
      { icon: Layers, title: 'Niveaux & Classes', items: [
        'Créez et gérez les niveaux scolaires',
        'Organisez les classes par niveau et filière',
        'Assignez les cours aux classes',
      ]},
      { icon: Upload, title: 'Documents', items: [
        'Publiez les cours, programmes et règlements',
        'Gérez les documents par matière et classe',
        'Supprimez ou mettez à jour les documents existants',
      ]},
      { icon: BarChart3, title: 'Statistiques', items: [
        'Consultez les statistiques détaillées de votre école',
        'Analysez l\'utilisation de l\'IA par les élèves',
        'Exportez les rapports d\'activité',
      ]},
      { icon: FileText, title: 'Exports', items: [
        'Exportez les données de votre établissement',
        'Formats disponibles : PDF, Excel, TXT',
      ]},
      { icon: Shield, title: 'Administration', items: [
        'Utilisez votre clé d\'accès unique pour vous connecter',
        'Toutes les actions sont sécurisées et tracées',
      ]},
    ],
  },

};

function buildPrintHtml(): string {
  const roleSections = Object.entries(guideContent).map(([_, content]) => `
    <div class="role-section">
      <h2>${content.title}</h2>
      <div class="sections-grid">
        ${content.sections.map(section => `
          <div class="section-card">
            <h3>${section.title}</h3>
            <ul>
              ${section.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Guide d'utilisation — Assistant Réussite</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #111; background: #fff;
    padding: 2rem; line-height: 1.5;
    max-width: 900px; margin: 0 auto;
  }
  h1 {
    font-size: 1.5rem; font-weight: 700;
    margin-bottom: 0.25rem; color: #020617;
  }
  .subtitle { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
  .role-section { margin-bottom: 2rem; page-break-inside: avoid; }
  .role-section h2 {
    font-size: 1.125rem; font-weight: 700;
    margin-bottom: 0.75rem; padding-bottom: 0.5rem;
    border-bottom: 2px solid #11caa0; color: #020617;
  }
  .sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .section-card {
    background: #f5f5f5; border: 1px solid #ddd;
    border-radius: 0.75rem; padding: 1rem;
    page-break-inside: avoid;
  }
  .section-card h3 {
    font-size: 0.875rem; font-weight: 700;
    margin-bottom: 0.5rem; color: #020617;
  }
  .section-card ul { list-style: none; }
  .section-card li {
    font-size: 0.8125rem; color: #333;
    padding-left: 1.25rem; position: relative;
    margin-bottom: 0.25rem;
  }
  .section-card li::before {
    content: ''; position: absolute; left: 0; top: 0.45em;
    width: 0.5rem; height: 0.5rem;
    background: #11caa0; border-radius: 50%;
  }
  footer {
    margin-top: 2rem; padding-top: 1rem;
    border-top: 1px solid #ddd;
    font-size: 0.75rem; color: #999; text-align: center;
  }
  @media print {
    body { padding: 0; max-width: none; }
    .sections-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .sections-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <h1>Guide d'utilisation — Assistant Réussite</h1>
  <p class="subtitle">DataSchool.ai — v1.0</p>
  ${roleSections}
  <footer>Assistant Réussite — Guide utilisateur v1.0 &bull; DataSchool.ai</footer>
  <script>window.print();window.close();<\/script>
</body>
</html>`;
}

export default function GuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(buildPrintHtml());
    w.document.close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative glass rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          >
            {/* Header — sticky */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-emeraude-400" />
                Guide d'utilisation
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#11caa0]/10 text-[#11caa0] border border-[#11caa0]/20 rounded-lg text-xs font-semibold hover:bg-[#11caa0]/20 transition-all active:scale-95"
                  aria-label="Télécharger le guide en PDF"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-nuit-300 hover:text-white transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 sm:space-y-6">
              {Object.entries(guideContent).map(([roleKey, content]) => (
                <div key={roleKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center shrink-0">
                      <content.icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white capitalize">{content.title}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {content.sections.map((section) => (
                      <div key={section.title} className="bg-[#0f172a]/60 border border-white/5 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <section.icon className="w-4 h-4 text-[#11caa0] shrink-0" />
                          <h4 className="text-xs sm:text-sm font-semibold text-white">{section.title}</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {section.items.map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-300">
                              <svg className="w-3.5 h-3.5 text-[#11caa0] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-white/10 text-center shrink-0">
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                Assistant Réussite — Guide utilisateur v1.0 • DataSchool.ai
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
