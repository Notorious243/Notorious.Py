import { motion, AnimatePresence } from "motion/react";
import { X, Save, Shield, Eye, EyeOff, ExternalLink } from "lucide-react";
import { SiGoogle, SiOpenai, SiAnthropic, SiHuggingface } from "react-icons/si";
import { ApiKeys, Provider } from "./types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

const OpenRouterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const GroqIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

const DeepSeekIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const KEY_FIELDS: { key: keyof ApiKeys; provider: Provider; label: string; placeholder: string; url: string; free?: boolean; icon: any; color: string }[] = [
  { key: 'google', provider: 'google', label: 'Google Gemini', placeholder: 'AIzaSy...', url: 'https://aistudio.google.com/apikey', icon: SiGoogle, color: 'text-blue-500' },
  { key: 'openrouter', provider: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...', url: 'https://openrouter.ai/keys', free: true, icon: OpenRouterIcon, color: 'text-indigo-500' },
  { key: 'groq', provider: 'groq', label: 'Groq', placeholder: 'gsk_...', url: 'https://console.groq.com/keys', free: true, icon: GroqIcon, color: 'text-emerald-500' },
  { key: 'openai', provider: 'openai', label: 'OpenAI', placeholder: 'sk-...', url: 'https://platform.openai.com/api-keys', icon: SiOpenai, color: 'text-green-600' },
  { key: 'anthropic', provider: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/settings/keys', icon: SiAnthropic, color: 'text-orange-500' },
  { key: 'deepseek', provider: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...', url: 'https://platform.deepseek.com/api_keys', icon: DeepSeekIcon, color: 'text-violet-500' },
  { key: 'huggingface', provider: 'huggingface', label: 'Hugging Face', placeholder: 'hf_...', url: 'https://huggingface.co/settings/tokens', free: true, icon: SiHuggingface, color: 'text-amber-500' },
];

export function SettingsModal({ isOpen, onClose, apiKeys, onSave }: SettingsModalProps) {
  const [keys, setKeys] = useState<ApiKeys>(apiKeys);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    if (isOpen) setKeys(apiKeys);
  }, [apiKeys, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 z-[140] bg-black/20 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute inset-2 z-[141] flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary/5 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Cles API</h2>
                  <p className="text-[10px] text-muted-foreground">Chaque utilisateur doit configurer ses propres cles</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Vos cles sont stockees localement et synchronisees avec votre compte.</p>
                <button onClick={() => setShowKeys(!showKeys)} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent">
                  {showKeys ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showKeys ? "Masquer" : "Afficher"}
                </button>
              </div>

              <div className="space-y-3">
                {KEY_FIELDS.map(({ key, label, placeholder, url, free, icon: Icon, color }) => (
                  <div key={key} className="rounded-xl border border-border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <Icon className={cn("h-4 w-4", color)} />
                        <span>{label}</span>
                        {free && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold uppercase">Gratuit</span>}
                      </label>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                        Obtenir une cle <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    <input
                      type={showKeys ? "text" : "password"}
                      value={keys[key] || ''}
                      onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    />
                    {keys[key] && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-emerald-600 font-medium">Configuree</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border bg-primary/5 p-4">
              <button
                onClick={() => { onSave(keys); onClose(); }}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
