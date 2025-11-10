import specialistsSeed from "../../local_data/specialists.json";
import type { Specialist } from "@/types";

export interface SpecialistColorClasses {
  bg: string;
  text: string;
  border: string;
}

export interface SpecialistThemeClasses {
  gradient: string;
  avatarBg: string;
  avatarText: string;
  assistantBubble: string;
  assistantText: string;
  userBubble: string;
  userText: string;
  accent: string;
  chip: string;
}

const colorMap: Record<string, SpecialistColorClasses> = {
  pink: { bg: "bg-pink-100", text: "text-pink-600", border: "border-pink-200" },
  orange: { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-200" },
  blue: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
  green: { bg: "bg-green-100", text: "text-green-600", border: "border-green-200" },
  red: { bg: "bg-red-100", text: "text-red-600", border: "border-red-200" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600", border: "border-yellow-200" },
  teal: { bg: "bg-teal-100", text: "text-teal-600", border: "border-teal-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-200" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600", border: "border-indigo-200" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-600", border: "border-cyan-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-200" },
  slate: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  violet: { bg: "bg-violet-100", text: "text-violet-600", border: "border-violet-200" },
  lime: { bg: "bg-lime-100", text: "text-lime-600", border: "border-lime-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
  rose: { bg: "bg-rose-100", text: "text-rose-600", border: "border-rose-200" },
  sky: { bg: "bg-sky-100", text: "text-sky-600", border: "border-sky-200" },
  stone: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-200" },
};

const themeMap: Record<string, SpecialistThemeClasses> = {
  blue: {
    gradient: "from-blue-600/90 via-indigo-600/90 to-blue-500/90",
    avatarBg: "bg-blue-100",
    avatarText: "text-blue-600",
    assistantBubble: "bg-blue-50/90 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100",
    assistantText: "text-blue-900 dark:text-blue-100",
    userBubble: "bg-blue-600",
    userText: "text-white",
    accent: "text-blue-100",
    chip: "border border-blue-400/40 bg-blue-500/10 text-blue-100",
  },
  green: {
    gradient: "from-green-600/90 via-emerald-600/90 to-teal-500/90",
    avatarBg: "bg-green-100",
    avatarText: "text-emerald-600",
    assistantBubble: "bg-green-50/90 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
    assistantText: "text-emerald-900 dark:text-emerald-100",
    userBubble: "bg-emerald-600",
    userText: "text-white",
    accent: "text-emerald-100",
    chip: "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  },
  pink: {
    gradient: "from-pink-600/90 via-rose-600/90 to-pink-500/90",
    avatarBg: "bg-pink-100",
    avatarText: "text-rose-600",
    assistantBubble: "bg-pink-50/90 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
    assistantText: "text-rose-900 dark:text-rose-100",
    userBubble: "bg-rose-600",
    userText: "text-white",
    accent: "text-rose-100",
    chip: "border border-rose-400/40 bg-rose-500/10 text-rose-100",
  },
  purple: {
    gradient: "from-purple-600/90 via-violet-600/90 to-indigo-500/90",
    avatarBg: "bg-purple-100",
    avatarText: "text-purple-600",
    assistantBubble: "bg-purple-50/90 text-purple-900 dark:bg-violet-900/40 dark:text-violet-100",
    assistantText: "text-purple-900 dark:text-violet-100",
    userBubble: "bg-purple-600",
    userText: "text-white",
    accent: "text-violet-100",
    chip: "border border-violet-400/40 bg-violet-500/10 text-violet-100",
  },
  orange: {
    gradient: "from-orange-600/90 via-amber-600/90 to-orange-500/90",
    avatarBg: "bg-orange-100",
    avatarText: "text-orange-600",
    assistantBubble: "bg-orange-50/90 text-orange-900 dark:bg-amber-900/40 dark:text-amber-100",
    assistantText: "text-orange-900 dark:text-amber-100",
    userBubble: "bg-orange-600",
    userText: "text-white",
    accent: "text-amber-100",
    chip: "border border-amber-400/40 bg-amber-500/10 text-amber-100",
  },
  red: {
    gradient: "from-rose-600/90 via-red-600/90 to-orange-500/90",
    avatarBg: "bg-rose-100",
    avatarText: "text-rose-600",
    assistantBubble: "bg-rose-50/90 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
    assistantText: "text-rose-900 dark:text-rose-100",
    userBubble: "bg-rose-600",
    userText: "text-white",
    accent: "text-rose-100",
    chip: "border border-rose-400/40 bg-rose-500/10 text-rose-100",
  },
  teal: {
    gradient: "from-teal-600/90 via-cyan-600/90 to-emerald-500/90",
    avatarBg: "bg-teal-100",
    avatarText: "text-teal-600",
    assistantBubble: "bg-teal-50/90 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100",
    assistantText: "text-teal-900 dark:text-teal-100",
    userBubble: "bg-teal-600",
    userText: "text-white",
    accent: "text-teal-100",
    chip: "border border-teal-400/40 bg-teal-500/10 text-teal-100",
  },
  indigo: {
    gradient: "from-indigo-600/90 via-blue-700/90 to-sky-500/90",
    avatarBg: "bg-indigo-100",
    avatarText: "text-indigo-600",
    assistantBubble: "bg-indigo-50/90 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100",
    assistantText: "text-indigo-900 dark:text-indigo-100",
    userBubble: "bg-indigo-600",
    userText: "text-white",
    accent: "text-indigo-100",
    chip: "border border-indigo-400/40 bg-indigo-500/10 text-indigo-100",
  },
  yellow: {
    gradient: "from-amber-400/90 via-yellow-500/90 to-orange-400/90",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-600",
    assistantBubble: "bg-amber-50/90 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
    assistantText: "text-amber-900 dark:text-amber-100",
    userBubble: "bg-amber-500",
    userText: "text-white",
    accent: "text-amber-100",
    chip: "border border-amber-400/40 bg-amber-500/10 text-amber-100",
  },
  violet: {
    gradient: "from-violet-600/90 via-fuchsia-600/90 to-purple-500/90",
    avatarBg: "bg-violet-100",
    avatarText: "text-fuchsia-600",
    assistantBubble: "bg-violet-50/90 text-fuchsia-900 dark:bg-fuchsia-900/40 dark:text-fuchsia-100",
    assistantText: "text-fuchsia-900 dark:text-fuchsia-100",
    userBubble: "bg-fuchsia-600",
    userText: "text-white",
    accent: "text-fuchsia-100",
    chip: "border border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100",
  },
  cyan: {
    gradient: "from-cyan-600/90 via-sky-600/90 to-blue-500/90",
    avatarBg: "bg-cyan-100",
    avatarText: "text-cyan-600",
    assistantBubble: "bg-cyan-50/90 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-100",
    assistantText: "text-cyan-900 dark:text-cyan-100",
    userBubble: "bg-cyan-600",
    userText: "text-white",
    accent: "text-cyan-100",
    chip: "border border-cyan-400/40 bg-cyan-500/10 text-cyan-100",
  },
  amber: {
    gradient: "from-amber-600/90 via-orange-600/90 to-yellow-500/90",
    avatarBg: "bg-amber-100",
    avatarText: "text-amber-600",
    assistantBubble: "bg-amber-50/90 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
    assistantText: "text-amber-900 dark:text-amber-100",
    userBubble: "bg-amber-600",
    userText: "text-white",
    accent: "text-amber-100",
    chip: "border border-amber-400/40 bg-amber-500/10 text-amber-100",
  },
  rose: {
    gradient: "from-rose-600/90 via-red-600/90 to-pink-500/90",
    avatarBg: "bg-rose-100",
    avatarText: "text-rose-600",
    assistantBubble: "bg-rose-50/90 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
    assistantText: "text-rose-900 dark:text-rose-100",
    userBubble: "bg-rose-600",
    userText: "text-white",
    accent: "text-rose-100",
    chip: "border border-rose-400/40 bg-rose-500/10 text-rose-100",
  },
  lime: {
    gradient: "from-lime-600/90 via-green-600/90 to-emerald-500/90",
    avatarBg: "bg-lime-100",
    avatarText: "text-lime-600",
    assistantBubble: "bg-lime-50/90 text-lime-900 dark:bg-lime-900/40 dark:text-lime-100",
    assistantText: "text-lime-900 dark:text-lime-100",
    userBubble: "bg-lime-600",
    userText: "text-white",
    accent: "text-lime-100",
    chip: "border border-lime-400/40 bg-lime-500/10 text-lime-100",
  },
  emerald: {
    gradient: "from-emerald-600/90 via-green-600/90 to-teal-500/90",
    avatarBg: "bg-emerald-100",
    avatarText: "text-emerald-600",
    assistantBubble: "bg-emerald-50/90 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
    assistantText: "text-emerald-900 dark:text-emerald-100",
    userBubble: "bg-emerald-600",
    userText: "text-white",
    accent: "text-emerald-100",
    chip: "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  },
  sky: {
    gradient: "from-sky-600/90 via-cyan-600/90 to-blue-500/90",
    avatarBg: "bg-sky-100",
    avatarText: "text-sky-600",
    assistantBubble: "bg-sky-50/90 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
    assistantText: "text-sky-900 dark:text-sky-100",
    userBubble: "bg-sky-600",
    userText: "text-white",
    accent: "text-sky-100",
    chip: "border border-sky-400/40 bg-sky-500/10 text-sky-100",
  },
  stone: {
    gradient: "from-stone-600/90 via-slate-600/90 to-gray-500/90",
    avatarBg: "bg-stone-100",
    avatarText: "text-stone-600",
    assistantBubble: "bg-stone-50/90 text-stone-900 dark:bg-stone-900/40 dark:text-stone-100",
    assistantText: "text-stone-900 dark:text-stone-100",
    userBubble: "bg-stone-600",
    userText: "text-white",
    accent: "text-stone-100",
    chip: "border border-stone-400/40 bg-stone-500/10 text-stone-100",
  },
  slate: {
    gradient: "from-slate-600/90 via-blue-600/90 to-indigo-500/90",
    avatarBg: "bg-slate-100",
    avatarText: "text-slate-600",
    assistantBubble: "bg-slate-50/90 text-slate-900 dark:bg-slate-900/40 dark:text-slate-100",
    assistantText: "text-slate-900 dark:text-slate-100",
    userBubble: "bg-slate-600",
    userText: "text-white",
    accent: "text-slate-100",
    chip: "border border-slate-400/40 bg-slate-500/10 text-slate-100",
  },
};

const DEFAULT_THEME: SpecialistThemeClasses = {
  gradient: "from-blue-600/90 via-indigo-600/90 to-blue-500/90",
  avatarBg: "bg-primary dark:bg-blue-600",
  avatarText: "text-white",
  assistantBubble: "bg-gray-100 dark:bg-gray-700",
  assistantText: "text-secondary dark:text-white",
  userBubble: "bg-primary dark:bg-blue-600",
  userText: "text-white",
  accent: "text-blue-100",
  chip: "border border-blue-400/40 bg-blue-500/10 text-blue-100",
};

const normalizeSpecialist = (specialist: any, index: number): Specialist => {
  const color = specialist.color ?? "blue";
  return {
    ...specialist,
    id: typeof specialist.id === "number" ? specialist.id : index + 1,
    color,
    aliases: Array.isArray(specialist.aliases) ? specialist.aliases : [],
    theme: specialist.theme ?? {},
    knowledgeBase: specialist.knowledgeBase ?? {},
  };
};

const fallbackSpecialists: Specialist[] = (specialistsSeed as any[]).map(normalizeSpecialist);
let cachedSpecialists: Specialist[] | null = null;

export const getColorClasses = (color: string): SpecialistColorClasses => {
  return colorMap[color] || colorMap.blue;
};

export const getSpecialistTheme = (specialist?: Specialist | null): SpecialistThemeClasses => {
  const colorKey = specialist?.theme?.color ?? specialist?.color ?? "blue";
  const baseTheme = themeMap[colorKey] || DEFAULT_THEME;
  if (!specialist?.theme) {
    return baseTheme;
  }

  return {
    gradient: specialist.theme.gradient ?? baseTheme.gradient,
    avatarBg: specialist.theme.avatarBg ?? baseTheme.avatarBg,
    avatarText: specialist.theme.avatarText ?? baseTheme.avatarText,
    assistantBubble: specialist.theme.assistantBubble ?? baseTheme.assistantBubble,
    assistantText: specialist.theme.assistantText ?? baseTheme.assistantText,
    userBubble: specialist.theme.userBubble ?? baseTheme.userBubble,
    userText: specialist.theme.userText ?? baseTheme.userText,
    accent: specialist.theme.accent ?? baseTheme.accent,
    chip: specialist.theme.chip ?? baseTheme.chip,
  };
};

const mapSpecialistArray = (data: any[]): Specialist[] => {
  return data.map((item, index) => {
    if (item?.specialist) {
      return normalizeSpecialist(item.specialist, index);
    }
    return normalizeSpecialist(item, index);
  });
};

export const getFallbackSpecialists = (): Specialist[] => fallbackSpecialists;

const isBrowser = () => typeof window !== "undefined" && typeof window.fetch === "function";

export const loadSpecialists = async (): Promise<Specialist[]> => {
  if (cachedSpecialists) {
    return cachedSpecialists;
  }

  if (isBrowser()) {
    try {
      const response = await fetch("/local_data/specialists.json", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          cachedSpecialists = mapSpecialistArray(data);
          return cachedSpecialists;
        }
      }
    } catch (error) {
      console.warn("Failed to fetch specialists from local JSON, falling back to seed data.", error);
    }
  }

  cachedSpecialists = fallbackSpecialists;
  return cachedSpecialists;
};

export const findSpecialistByKey = (specialists: Specialist[], key?: string | null): Specialist | undefined => {
  if (!key) return undefined;
  const searchKey = key.toLowerCase();
  return specialists.find((specialist) => {
    if (specialist.key?.toLowerCase() === searchKey) return true;
    return specialist.aliases?.some((alias) => alias.toLowerCase() === searchKey);
  });
};

export const findSpecialistById = (specialists: Specialist[], id?: number | null): Specialist | undefined => {
  if (typeof id !== "number") return undefined;
  return specialists.find((specialist) => specialist.id === id);
};
