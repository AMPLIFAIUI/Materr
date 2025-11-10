import type { SpecialistThemeClasses } from "@/lib/specialists";

interface TypingIndicatorProps {
  theme?: SpecialistThemeClasses;
  icon?: string;
}

export function TypingIndicator({ theme, icon = 'fas fa-comment' }: TypingIndicatorProps) {
  const avatarBg = theme?.avatarBg ?? 'bg-primary dark:bg-blue-600';
  const avatarText = theme?.avatarText ?? 'text-white';
  const bubble = theme?.assistantBubble ?? 'bg-gray-100 dark:bg-gray-700';

  return (
    <div className="flex space-x-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className={`w-10 h-10 ${avatarBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner`}>
        <i className={`${icon} ${avatarText} text-xs`}></i>
      </div>
      <div className="flex-1">
        <div className={`${bubble} rounded-2xl rounded-tl-md p-4 max-w-xs`}>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
