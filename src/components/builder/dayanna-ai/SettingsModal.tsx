import { motion, AnimatePresence } from "motion/react";
import { X, Save, Shield, Eye, EyeOff, ExternalLink, Copy } from "lucide-react";
import { ApiKeys, Provider } from "./types";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ProviderBrandIcon } from "./provider-brand-icons";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

const KEY_FIELDS: {
  key: keyof ApiKeys;
  provider: Provider;
  label: string;
  placeholder: string;
  url: string;
  free?: boolean;
  credentialLabel: string;
  learnActionLabel: string;
}[] = [
  { key: 'google', provider: 'google', label: 'Google Gemini', placeholder: 'AIzaSy...', url: 'https://aistudio.google.com/apikey', credentialLabel: 'Clé API', learnActionLabel: 'Obtenir une clé' },
  { key: 'openrouter', provider: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...', url: 'https://openrouter.ai/keys', free: true, credentialLabel: 'Clé API', learnActionLabel: 'Obtenir une clé' },
  { key: 'groq', provider: 'groq', label: 'Groq', placeholder: 'gsk_...', url: 'https://console.groq.com/keys', free: true, credentialLabel: 'Clé API', learnActionLabel: 'Obtenir une clé' },
  { key: 'openai', provider: 'openai', label: 'OpenAI', placeholder: 'sk-...', url: 'https://platform.openai.com/api-keys', credentialLabel: 'Clé API', learnActionLabel: 'Obtenir une clé' },
  { key: 'anthropic', provider: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...', url: 'https://console.anthropic.com/settings/keys', credentialLabel: 'Clé API', learnActionLabel: 'Obtenir une clé' },
  { key: 'deepseek', provider: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...', url: 'https://platform.deepseek.com/api_keys', credentialLabel: 'Clé API', learnActionLabel: 'Obtenir une clé' },
  { key: 'huggingface', provider: 'huggingface', label: 'Hugging Face', placeholder: 'hf_...', url: 'https://huggingface.co/settings/tokens', free: true, credentialLabel: "Token d'accès", learnActionLabel: 'Obtenir un token' },
];

export function SettingsModal({ isOpen, onClose, apiKeys, onSave }: SettingsModalProps) {
  const [keys, setKeys] = useState<ApiKeys>(apiKeys);
  const [visibleKeys, setVisibleKeys] = useState<Partial<Record<keyof ApiKeys, boolean>>>({});

  useEffect(() => {
    if (!isOpen) return;
    setKeys(apiKeys);
    setVisibleKeys({});
  }, [apiKeys, isOpen]);

  const sortedFields = useMemo(
    () =>
      [...KEY_FIELDS].sort((a, b) => {
        const aConfigured = Boolean(keys[a.key]?.trim());
        const bConfigured = Boolean(keys[b.key]?.trim());
        return Number(bConfigured) - Number(aConfigured);
      }),
    [keys]
  );

  const configuredCount = useMemo(
    () => KEY_FIELDS.filter(({ key }) => Boolean(keys[key]?.trim())).length,
    [keys]
  );

  const toggleKeyVisibility = (key: keyof ApiKeys) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyKey = async (key: keyof ApiKeys, label: string, credentialLabel: string) => {
    const value = keys[key]?.trim();
    if (!value) {
      toast.error(`Aucun ${credentialLabel.toLowerCase()} ${label} a copier`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${credentialLabel} ${label} copie`);
    } catch {
      toast.error(`Impossible de copier ${credentialLabel.toLowerCase()} ${label}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 z-[140] bg-black/45 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute inset-2 z-[141] flex flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-primary/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                  <Shield className="h-4 w-4 text-primary/90" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-foreground">Accès Providers (clés/tokens)</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {configuredCount}/{KEY_FIELDS.length} providers configures
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/70">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 rounded-xl border border-border/60 bg-background/40 p-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Les providers sans cle API ne s'affichent pas dans le selecteur de l'input message.
                  Configurez vos acces ici (token Hugging Face inclus) pour les activer.
                </p>
              </div>

              <div className="space-y-3">
                {sortedFields.map(({ key, provider, label, placeholder, url, free, credentialLabel, learnActionLabel }) => {
                  const value = keys[key] || '';
                  const isConfigured = Boolean(value.trim());
                  const isVisible = Boolean(visibleKeys[key]);

                  return (
                    <div
                      key={key}
                      className={cn(
                        "rounded-xl border p-3 transition-colors",
                        isConfigured ? "border-primary/30 bg-primary/[0.04]" : "border-border/60 bg-background/40"
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                            isConfigured ? "border-primary/30 bg-primary/10" : "border-border/60 bg-muted/40"
                          )}>
                            <ProviderBrandIcon provider={provider} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate whitespace-nowrap text-xs font-semibold text-foreground">{label}</span>
                              {free && <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-500">Gratuit</span>}
                            </div>
                            <div className="mt-1">
                              <span className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
                                isConfigured ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
                              )}>
                                {isConfigured ? 'Configuree' : 'Non configuree'}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground">{credentialLabel}</p>
                          </div>
                        </div>

                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex shrink-0 items-center gap-1 text-[10px] text-primary/90 hover:text-primary hover:underline"
                        >
                          {learnActionLabel} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>

                      <div className="relative">
                        <input
                          type={isVisible ? "text" : "password"}
                          value={value}
                          onChange={(e) => setKeys({ ...keys, [key]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 pr-16 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                        />

                        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(key)}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title={isVisible ? "Masquer la cle" : "Afficher la cle"}
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyKey(key, label, credentialLabel)}
                            disabled={!value.trim()}
                            className={cn(
                              "rounded-md p-1 transition-colors",
                              value.trim()
                                ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                                : "cursor-not-allowed text-muted-foreground/40"
                            )}
                            title="Copier la cle"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border/60 bg-primary/10 p-4">
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
