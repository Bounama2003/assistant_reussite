import { motion } from 'framer-motion';
import { X, Phone, Calendar, BookOpen, User, School, Tag, CheckCircle, XCircle, Mail, Star, Users, Shield } from 'lucide-react';
import type { Lead, Student, Professor } from '@/types';
import { formatDate, formatPhone } from '@/lib/utils';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function DetailModal({ open, onClose, children }: DetailModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative glass rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-nuit-400 z-10">
          <X size={18} />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-nuit-700/50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-emeraude-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-nuit-400">{label}</p>
        <div className="text-sm text-white mt-0.5">{value}</div>
      </div>
    </div>
  );
}

/* ---------- Lead Detail ---------- */
export function LeadDetailModal({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
  return (
    <DetailModal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center text-xl font-bold text-white">
            {(lead.student_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{lead.student_name}</h2>
            <p className="text-sm text-nuit-300">Lead</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow icon={Phone} label="Téléphone" value={formatPhone(lead.phone)} />
          <DetailRow icon={BookOpen} label="Série" value={lead.serie || 'Non spécifiée'} />
          <DetailRow icon={Tag} label="Classe" value={lead.classe || 'Non spécifiée'} />
          <DetailRow icon={Calendar} label="Date d'inscription" value={formatDate(lead.created_at)} />
          <DetailRow icon={School} label="École" value={lead.school_id} />
          <DetailRow icon={User} label="ID" value={<span className="font-mono text-xs">{lead.id}</span>} />
        </div>
      </div>
    </DetailModal>
  );
}

/* ---------- Student Detail ---------- */
export function StudentDetailModal({ student, open, onClose }: { student: Student; open: boolean; onClose: () => void }) {
  return (
    <DetailModal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white">
            {(student.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{student.name}</h2>
            <p className="text-sm text-nuit-300">Élève</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow icon={Phone} label="Téléphone" value={formatPhone(student.phone)} />
          <DetailRow icon={BookOpen} label="Série" value={student.serie || 'Non spécifiée'} />
          <DetailRow icon={Tag} label="Classe" value={student.classe || 'Non spécifiée'} />
          <DetailRow icon={School} label="École" value={student.school_id} />
          <DetailRow
            icon={CheckCircle}
            label="Statut"
            value={
              <span className={`inline-flex items-center gap-1 text-sm ${student.is_active ? 'text-emeraude-400' : 'text-danger'}`}>
                {student.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {student.is_active ? 'Actif' : 'Inactif'}
              </span>
            }
          />
          <DetailRow icon={User} label="ID" value={<span className="font-mono text-xs">{student.id}</span>} />
        </div>
      </div>
    </DetailModal>
  );
}

/* ---------- Professor Detail ---------- */
export function ProfessorDetailModal({ professor, open, onClose }: { professor: Professor; open: boolean; onClose: () => void }) {
  return (
    <DetailModal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
            {(professor.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{professor.name}</h2>
            <p className="text-sm text-nuit-300">Professeur</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow icon={Phone} label="Téléphone" value={professor.phone} />
          <DetailRow icon={School} label="École" value={professor.school_id} />
          <DetailRow
            icon={BookOpen}
            label="Matières"
            value={
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(professor.matieres || []).length > 0
                  ? professor.matieres.map((m) => (
                      <span key={m} className="text-xs bg-emeraude-500/10 text-emeraude-400 px-1.5 py-0.5 rounded">{m}</span>
                    ))
                  : 'Aucune'}
              </div>
            }
          />
          <DetailRow
            icon={Tag}
            label="Classes"
            value={
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(professor.classes || []).length > 0
                  ? professor.classes.map((c) => (
                      <span key={c} className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">{c}</span>
                    ))
                  : 'Aucune'}
              </div>
            }
          />
          <DetailRow
            icon={Shield}
            label="Clé API"
            value={<span className="font-mono text-xs text-emeraude-400 break-all">{professor.professor_key}</span>}
          />
          <DetailRow
            icon={CheckCircle}
            label="Statut"
            value={
              <span className={`inline-flex items-center gap-1 text-sm ${professor.is_active ? 'text-emeraude-400' : 'text-danger'}`}>
                {professor.is_active ? 'Actif' : 'Inactif'}
              </span>
            }
          />
          {professor.created_at && (
            <DetailRow icon={Calendar} label="Date de création" value={formatDate(professor.created_at)} />
          )}
        </div>
      </div>
    </DetailModal>
  );
}
