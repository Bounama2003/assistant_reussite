import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, FileBadge } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { downloadFile } from '@/lib/download';

export default function AdminExports() {
  const { schoolId } = useAuthStore();

  const exports = [
    {
      icon: FileSpreadsheet,
      title: 'Leads (Excel)',
      desc: 'Exportez la liste des leads au format Excel',
      onClick: () => downloadFile(`/exports/schools/${schoolId}/leads/excel`),
      color: 'from-emeraude-500 to-emeraude-600',
    },
    {
      icon: FileText,
      title: 'Leads (PDF)',
      desc: 'Exportez la liste des leads au format PDF',
      onClick: () => downloadFile(`/exports/schools/${schoolId}/leads/pdf`),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FileSpreadsheet,
      title: 'Élèves (Excel)',
      desc: 'Exportez la liste des élèves au format Excel',
      onClick: () => downloadFile(`/exports/schools/${schoolId}/students/excel`),
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: FileBadge,
      title: 'Élèves (PDF)',
      desc: 'Exportez la liste des élèves au format PDF',
      onClick: () => downloadFile(`/exports/schools/${schoolId}/students/pdf`),
      color: 'from-amber-500 to-amber-600',
    },

  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Exports</h1>
        <p className="text-nuit-300 text-sm">Exportez vos données aux formats Excel et PDF</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {exports.map((exp, i) => (
          <motion.div
            key={exp.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <button onClick={exp.onClick} className="card-hover w-full text-left group">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exp.color} flex items-center justify-center shrink-0`}>
                  <exp.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{exp.title}</h3>
                  <p className="text-sm text-nuit-300">{exp.desc}</p>
                </div>
                <Download className="w-5 h-5 text-emeraude-400 shrink-0 mt-1 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
