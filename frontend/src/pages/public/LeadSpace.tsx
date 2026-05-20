import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, User, Bot, Phone, BookOpen, Loader2, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Building2, GraduationCap, Check } from 'lucide-react';
import api from '@/services/api';
import type { School as SchoolType, ChatResponse, Source } from '@/types';

function parseInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m
      ? <strong key={i} className="font-bold text-[#11caa0]">{m[1]}</strong>
      : <span key={i}>{part}</span>;
  });
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(<ul key={key++} className="list-disc pl-4 space-y-1.5 mt-2 mb-2 text-slate-300">{listItems}</ul>);
    listItems = [];
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushList();
      if (i > 0 && lines[i - 1].trim() === '') continue;
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    const heading = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (heading) {
      flushList();
      nodes.push(<h3 key={key++} className="text-base font-semibold text-white mt-3 mb-1">{heading[1]}</h3>);
      continue;
    }

    const bullet = trimmed.match(/^[\*\+]\s+(.*)/);
    if (bullet) {
      if (!inList) flushList();
      inList = true;
      listItems.push(<li key={key++}>{parseInline(bullet[1])}</li>);
      continue;
    }

    flushList();
    nodes.push(<div key={key++} className="mb-1">{parseInline(lines[i])}</div>);
  }
  flushList();

  return nodes.length ? nodes : [<span key={0}>{text}</span>];
}

export default function LeadSpace() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();

  const [school, setSchool] = useState<SchoolType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lead form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serie, setSerie] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const phonePrefix = '+221';

  const steps = [
    { label: 'Identité' },
    { label: 'Contact' },
    { label: 'Confirmation' },
  ];

  // Levels
  const [levels, setLevels] = useState<Array<{ id: string; nom_niveau: string }>>([]);

  // Chat
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [showSources, setShowSources] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    Promise.all([
      api.get(`/school/${schoolId}`),
      api.get(`/school/${schoolId}/levels`).catch(() => ({ data: [] })),
    ]).then(([schoolRes, levelsRes]) => {
      setSchool(schoolRes.data);
      setLevels(Array.isArray(levelsRes.data) ? levelsRes.data : []);
      setLoading(false);
    }).catch(() => {
      setError('École introuvable. Vérifiez le nom et réessayez.');
      setLoading(false);
    });
  }, [schoolId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLeadSubmit = async () => {
    if (!schoolId) return;
    setFormLoading(true);
    setFormError(null);

    if (!phone.startsWith('+221') || phone.length !== 13) {
      setFormError('Le numéro doit être au format +221XXXXXXXXX');
      setFormLoading(false);
      return;
    }

    try {
      await api.post('/lead', {
        student_name: name,
        phone,
        serie: serie || undefined,
        school_id: schoolId,
      });
      setFormSuccess(true);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stepIndex === 0) {
      if (!name.trim()) {
        setFormError('Veuillez entrer votre nom');
        return;
      }
      setFormError(null);
      setStepIndex(1);
    } else if (stepIndex === 1) {
      if (phone.length !== 13) {
        setFormError('Le numéro doit être au format +221XXXXXXXXX');
        return;
      }
      setFormError(null);
      setStepIndex(2);
    } else {
      handleLeadSubmit();
    }
  };

  const handleChat = async () => {
    if (!question.trim() || !schoolId || chatLoading) return;
    const q = question;
    setQuestion('');
    setChatLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: q }]);

    try {
      const res = await api.post<ChatResponse>('/chat', {
        question: q,
        school_id: schoolId,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
      setSources(res.data.sources || []);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue. Veuillez réessayer.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nuit-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emeraude-400 to-emeraude-600 flex items-center justify-center animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-nuit-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !school || !schoolId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nuit-900">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-danger mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-3">École introuvable</h1>
          <p className="text-nuit-300 mb-8">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit-900">
      {/* School Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emeraude-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-10 sm:pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl glass flex items-center justify-center shrink-0">
              {school.logo_url ? (
                <img src={school.logo_url} alt={school.name} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              ) : (
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-emeraude-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">{school.name}</h1>
              <p className="text-sm sm:text-base text-nuit-300">Bienvenue sur l'espace d'information de {school.name}</p>
              {(school.nom_directeur || school.directeur_fondateur) && (
                <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 sm:mt-3">
                  {school.nom_directeur && (
                    <span className="text-xs sm:text-sm text-nuit-300"><span className="text-emeraude-400">Directeur:</span> {school.nom_directeur}</span>
                  )}
                  {school.directeur_fondateur && (
                    <span className="text-xs sm:text-sm text-nuit-300"><span className="text-emeraude-400">Fondateur:</span> {school.directeur_fondateur}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => navigate(`/auth/student?school=${schoolId}`)} className="btn-secondary text-xs sm:text-sm py-2 flex-1 sm:flex-none">Élève</button>
              <button onClick={() => navigate(`/auth/professor?school=${schoolId}`)} className="btn-secondary text-xs sm:text-sm py-2 flex-1 sm:flex-none">Professeur</button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Lead Registration Form */}
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="card p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emeraude-400" />
                Pré-inscription
              </h2>

              {formSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-emeraude-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Inscription réussie !</h3>
                  <p className="text-nuit-300 text-sm mb-6">Un administrateur va valider votre inscription. Vous recevrez vos identifiants par téléphone.</p>
                  <button onClick={() => navigate('/auth/student')} className="btn-primary text-sm flex items-center gap-2 mx-auto">
                    Se connecter <ArrowRight size={14} />
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center mb-8">
                    {Array.isArray(steps) && steps.map((s, i) => (
                      <div key={i} className="flex items-center flex-1 last:flex-none">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            stepIndex > i
                              ? 'bg-[#11caa0] text-[#020617]'
                              : stepIndex === i
                              ? 'bg-[#11caa0] text-[#020617] ring-4 ring-[#11caa0]/20'
                              : 'bg-[#1e293b] text-slate-500'
                          }`}>
                            {stepIndex > i ? <Check size={14} /> : i + 1}
                          </div>
                          <span className={`text-xs hidden sm:inline transition-colors duration-300 ${
                            stepIndex >= i ? 'text-white font-medium' : 'text-slate-500'
                          }`}>{s.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 sm:mx-3 bg-[#1e293b] rounded-full overflow-hidden">
                            <div className="h-full bg-[#11caa0] transition-all duration-500"
                              style={{ width: stepIndex > i ? '100%' : '0%' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleStepSubmit}>
                    {stepIndex === 0 && (
                      <motion.div key="step0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div>
                          <label className="block text-sm text-nuit-300 mb-1.5">Nom de l'élève</label>
                          <input type="text" value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#1e293b]/60 text-white rounded-xl px-4 py-3.5 mt-1.5 text-sm border border-white/5 focus:outline-none focus:border-[#11caa0] focus:bg-[#1e293b] transition-all placeholder-slate-500"
                            placeholder="Votre nom" required />
                        </div>
                        <div>
                          <label className="block text-sm text-nuit-300 mb-1.5">Niveau</label>
                          <select value={serie} onChange={(e) => setSerie(e.target.value)}
                            className="w-full bg-[#1e293b]/60 text-white rounded-xl px-4 py-3.5 mt-1.5 text-sm border border-white/5 focus:outline-none focus:border-[#11caa0] focus:bg-[#1e293b] transition-all">
                            <option value="" className="bg-[#0f172a]">Sélectionnez votre niveau...</option>
                            {Array.isArray(levels) && levels.map((l) => (
                              <option key={l.id} value={l.nom_niveau} className="bg-[#0f172a]">{l.nom_niveau}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {stepIndex === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <div>
                          <label className="block text-sm text-nuit-300 mb-1.5">Téléphone</label>
                          <div className="flex items-center bg-[#1e293b]/60 rounded-xl border border-white/5 focus-within:border-[#11caa0] focus-within:bg-[#1e293b] overflow-hidden transition-all mt-1.5">
                            <div className="px-3 text-slate-400 text-sm font-medium border-r border-white/10 py-3.5 shrink-0 leading-none select-none">
                              🇸🇳 +221
                            </div>
                            <input type="tel" pattern="[0-9]*" inputMode="numeric"
                              value={phone.replace(phonePrefix, '')}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                                setPhone(phonePrefix + digits);
                              }}
                              className="flex-1 bg-transparent text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none placeholder-slate-500"
                              placeholder="76 000 00 00" required />
                          </div>
                          <p className="text-xs text-slate-500 mt-2">Numéro sénégalais — 9 chiffres après +221</p>
                        </div>
                      </motion.div>
                    )}

                    {stepIndex === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <p className="text-sm text-slate-400">Vérifiez vos informations avant de valider :</p>
                        <div className="bg-[#1e293b]/60 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Nom</span>
                            <span className="text-sm text-white font-medium">{name}</span>
                          </div>
                          <div className="border-t border-white/5" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Niveau</span>
                            <span className="text-sm text-white font-medium">{serie || 'Non spécifié'}</span>
                          </div>
                          <div className="border-t border-white/5" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Téléphone</span>
                            <span className="text-sm text-white font-medium">{phone}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {formError && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-danger bg-danger/5 p-3 rounded-lg mt-4">
                        <AlertCircle size={14} />
                        {formError}
                      </motion.div>
                    )}

                    <div className="flex items-center gap-3 mt-8">
                      {stepIndex > 0 ? (
                        <button type="button" onClick={() => { setStepIndex(stepIndex - 1); setFormError(null); }}
                          className="px-4 py-3.5 border border-white/10 text-slate-400 rounded-xl text-sm font-medium active:bg-white/5 transition-colors">
                          Retour
                        </button>
                      ) : (
                        <div />
                      )}
                      <button type="submit" disabled={formLoading}
                        className="flex-1 py-3.5 bg-[#11caa0] text-[#020617] rounded-xl text-sm font-bold shadow-lg shadow-[#11caa0]/10 hover:scale-[1.01] active:scale-[0.99] transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100">
                        {stepIndex < steps.length - 1 ? 'Suivant' : formLoading ? <Loader2 className="animate-spin" size={16} /> : 'Valider'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>

          {/* Chat Interface */}
          <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="card flex flex-col h-[400px] sm:h-[500px] lg:h-[600px]">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-emeraude-400" />
                Posez vos questions sur l'école
              </h2>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.length === 0 && !chatLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-10 h-10 text-emeraude-400/50 mb-3" />
                    <p className="text-nuit-300 text-sm">Posez une question sur le programme,<br />le règlement, ou les contacts de l'école</p>
                  </div>
                )}

                {Array.isArray(messages) && messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-emeraude-500/20' : 'bg-nuit-600'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-emeraude-400" /> : <Bot className="w-4 h-4 text-nuit-300" />}
                    </div>
                    {msg.role === 'assistant' ? (
                      <div className="bg-[#0f172a] border border-white/5 text-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[85%] text-sm leading-relaxed shadow-md">
                        <div className="whitespace-pre-wrap">{parseMarkdown(msg.content)}</div>
                      </div>
                    ) : (
                      <div className="bg-[#11caa0] text-[#020617] font-medium rounded-2xl rounded-tr-none p-4 max-w-[85%] text-sm ml-auto shadow-md shadow-[#11caa0]/5">
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    )}
                  </motion.div>
                ))}

                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-nuit-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-nuit-300" />
                    </div>
                    <div className="bg-[#0f172a] border border-white/5 rounded-2xl rounded-tl-none p-4 shadow-md flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#11caa0] animate-spin" />
                      <span className="text-sm text-slate-400">Réflexion...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {Array.isArray(sources) && sources.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="text-xs text-emeraude-400 hover:text-emeraude-300 flex items-center gap-1"
                  >
                    <BookOpen size={12} />
                    {showSources ? 'Masquer' : 'Voir'} les sources ({(Array.isArray(sources) ? sources.length : 0)})
                  </button>
                  {showSources && (
                    <div className="mt-2 space-y-2">
                      {Array.isArray(sources) && sources.map((s, i) => (
                        <div key={i} className="text-xs text-nuit-300 glass-light rounded-lg p-2">
                          <p className="truncate">{s.content}</p>
                          {s.score && <span className="text-emeraude-400">Score: {(s.score * 100).toFixed(0)}%</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  className="input-field flex-1"
                  placeholder="Posez votre question..."
                  disabled={chatLoading}
                />
                <button
                  onClick={handleChat}
                  disabled={chatLoading || !question.trim()}
                  className="btn-primary px-4"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
