import { SiGoogle, SiOpenai, SiAnthropic, SiHuggingface } from "react-icons/si";
import type { Provider } from "./types";

const OpenRouterBrandIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="or-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#or-grad)" />
    <path d="M8 8.5h8M7.5 12h9M8 15.5h8" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const GroqBrandIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="groq-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#00D4AA" />
        <stop offset="1" stopColor="#14B8A6" />
      </linearGradient>
    </defs>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="url(#groq-grad)" />
    <path d="M7 8.5h10v7H7z" fill="none" stroke="white" strokeWidth="1.7" />
    <path d="M9.5 11.2h5" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const DeepSeekBrandIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="deep-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#2563EB" />
        <stop offset="1" stopColor="#38BDF8" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#deep-grad)" />
    <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function ProviderBrandIcon({ provider, className }: { provider: Provider; className?: string }) {
  switch (provider) {
    case "google":
      return <SiGoogle className={className} style={{ color: "#4285F4" }} />;
    case "openai":
      return <SiOpenai className={className} style={{ color: "#10A37F" }} />;
    case "anthropic":
      return <SiAnthropic className={className} style={{ color: "#D97757" }} />;
    case "huggingface":
      return <SiHuggingface className={className} style={{ color: "#FFB800" }} />;
    case "openrouter":
      return <OpenRouterBrandIcon className={className} />;
    case "groq":
      return <GroqBrandIcon className={className} />;
    case "deepseek":
      return <DeepSeekBrandIcon className={className} />;
    default:
      return null;
  }
}

