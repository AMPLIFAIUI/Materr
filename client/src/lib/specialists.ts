export interface Specialist {
  id: number;
  key: string;
  name: string;
  specialty: string;
  description: string;
  icon: string;
  color: string;
}

export const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
    lime: { bg: 'bg-lime-100', text: 'text-lime-600', border: 'border-lime-200' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    rose: { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
    sky: { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
    stone: { bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200' },
  };

  return colorMap[color] || colorMap.blue;
};
