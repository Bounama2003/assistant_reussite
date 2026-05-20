import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Building2, ArrowRight, ClipboardPaste, Shield, KeyRound } from 'lucide-react';

const MIN_CODE_LENGTH = 5;

export default function Landing() {
  const [code, setCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      setCode(raw);
      if (raw.length >= 1) sessionStorage.setItem('school_code', raw);
      else sessionStorage.removeItem('school_code');
      setIsCodeValid(raw.length >= MIN_CODE_LENGTH);
      if (raw.length < MIN_CODE_LENGTH) setRoleMenu(false);
    },
    [],
  );

  const handleSubmitCode = useCallback(() => {
    if (code.trim().length >= MIN_CODE_LENGTH) setRoleMenu(true);
  }, [code]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && code.trim().length >= MIN_CODE_LENGTH) {
        setRoleMenu(true);
      }
    },
    [code],
  );

  const handleJoinSchool = useCallback(() => {
    navigate(`/lead/${code.trim()}`);
  }, [code, navigate]);

  const handleAdminKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAdminKey(e.target.value);
    },
    [],
  );

  const handlePasteKey = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAdminKey(text);
      keyInputRef.current?.focus();
    } catch {}
  }, []);

  const handleAdminSubmit = useCallback(() => {
    if (!adminKey.trim() || !code.trim()) return;
    sessionStorage.setItem('admin_key', adminKey.trim());
    navigate(`/auth/admin?school=${encodeURIComponent(code.trim())}`);
  }, [adminKey, code, navigate]);

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col">
      <header className="w-full py-5 px-4">
        <div className="max-w-sm mx-auto flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3ddbb8] to-[#0ea889] flex items-center justify-center shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">
            Assistant <span className="text-[#11caa0]">Réussite</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              Portail d'accès aux établissements
            </h1>
            <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              Saisissez le code fourni par votre école pour accéder à votre espace.
            </p>
          </div>

          <div className="w-full bg-[#0f172a]/80 border border-white/5 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="school-code"
                  className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wider uppercase"
                >
                  Code établissement
                </label>
                <input
                  ref={inputRef}
                  id="school-code"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="EX: ECOLE-2026"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  className="w-full h-12 bg-[#1e293b] border border-white/10 rounded-xl px-4 text-center text-lg font-mono tracking-widest text-[#11caa0] placeholder-slate-600 focus:outline-none focus:border-[#11caa0] transition-all uppercase"
                  maxLength={20}
                />
              </div>

              <AnimatePresence>
                {isCodeValid && (
                  <motion.div
                    key="role-actions"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 space-y-3">
                      {!roleMenu ? (
                        <motion.button
                          key="validate"
                          onClick={handleSubmitCode}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="w-full h-12 bg-[#11caa0] text-[#020617] font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                        >
                          <Building2 size={16} />
                          Continuer
                          <ArrowRight size={16} />
                        </motion.button>
                      ) : (
                        <motion.div
                          key="role-buttons"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <button
                            onClick={handleJoinSchool}
                            className="w-full h-12 bg-[#11caa0] text-[#020617] font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                          >
                            <Building2 size={16} />
                            Rejoindre l'établissement
                          </button>

                          <div className="relative flex items-center gap-2">
                            <span className="flex-1 h-px bg-white/10" />
                            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                              Personnel
                            </span>
                            <span className="flex-1 h-px bg-white/10" />
                          </div>

                          <div className="space-y-3">
                            <label className="block text-xs font-medium text-slate-500 tracking-wider uppercase">
                              Clé d'accès sécurisée
                            </label>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ff9f0a]/60 pointer-events-none" />
                              <input
                                ref={keyInputRef}
                                type="password"
                                value={adminKey}
                                onChange={handleAdminKeyChange}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAdminSubmit();
                                }}
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                                placeholder="admin-xxx-..."
                                className="w-full h-12 bg-[#1e293b] border border-white/10 rounded-xl pl-10 pr-12 text-sm font-mono text-[#ff9f0a] placeholder-slate-600 focus:outline-none focus:border-[#ff9f0a] transition-all"
                              />
                              <button
                                onClick={handlePasteKey}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-[#ff9f0a] transition-colors"
                                aria-label="Coller la clé"
                                type="button"
                              >
                                <ClipboardPaste size={16} />
                              </button>
                            </div>
                            <button
                              onClick={handleAdminSubmit}
                              disabled={!adminKey.trim()}
                              className="w-full h-12 bg-[#ff9f0a] text-[#020617] font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Shield size={16} />
                              Accéder à l'administration
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 text-center mt-4">
            Code à 5 caractères minimum
          </p>
        </div>
      </main>

      <footer className="text-center text-[11px] text-slate-600 mt-8 mx-4 border-t border-white/5 pt-4 pb-6">
        Propulsé par DataSchool.ai • Sécurisé au niveau académique
      </footer>
    </div>
  );
}
