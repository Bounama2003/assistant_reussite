import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { SchoolLevel } from '@/types';
import { toast } from '@/lib/ui';

export default function AdminLevels() {
  const { adminKey, schoolId } = useAuthStore();
  const [levels, setLevels] = useState<SchoolLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    if (!schoolId) return;
    setLoading(true);
    setLoadError(null);
    api.get(`/school/${schoolId}/levels`)
      .then((res) => setLevels(res.data))
      .catch(() => setLoadError('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleCreate = async () => {
    if (!newName.trim() || !adminKey) return;
    setCreating(true);
    try {
      await api.post(`/school/${schoolId}/levels`, { nom_niveau: newName.trim() }, {
        headers: { 'X-Admin-Key': adminKey },
      });
      setNewName('');
      toast.success('Niveau ajouté');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminKey) return;
    try {
      await api.delete(`/school/${schoolId}/levels/${id}`, {
        headers: { 'X-Admin-Key': adminKey },
      });
      setLevels((prev) => prev.filter((l) => l.id !== id));
      toast.success('Niveau supprimé');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filtered = levels.filter((l) =>
    l.nom_niveau.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Niveaux</h1>
        <p className="text-nuit-300 text-sm">Niveaux scolaires configurables par école</p>
      </div>

      <div className="flex gap-3 max-w-md">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="input-field"
          placeholder="Nouveau niveau (ex: Terminale, 3ème...)"
        />
        <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary shrink-0">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nuit-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10!" placeholder="Rechercher..." />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full" />)}</div>
      ) : loadError ? (
        <div className="card text-center py-8 text-danger">{loadError}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Layers className="w-12 h-12 text-nuit-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucun niveau</h3>
          <p className="text-sm text-nuit-300">Ajoutez des niveaux pour les inscriptions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((level, i) => (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-hover flex items-center gap-4 py-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emeraude-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emeraude-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{level.nom_niveau}</p>
              </div>
              <button onClick={() => handleDelete(level.id)} className="p-2 rounded-lg hover:bg-danger/10 text-nuit-400 hover:text-danger transition-all">
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
