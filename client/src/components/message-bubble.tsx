import { format } from "date-fns";
import type { SpecialistThemeClasses } from "@/lib/specialists";

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'specialist';
  timestamp?: Date;
  specialistName?: string;
  specialistSpecialty?: string;
  specialistIcon?: string;
  theme?: SpecialistThemeClasses;
}

const formatTimestamp = (timestamp?: Date) => {
  if (!timestamp) return undefined;
  try {
    return format(timestamp, 'p');
  } catch {
    return undefined;
  }
};

export function MessageBubble({
  content,
  sender,
  timestamp,
  specialistName,
  specialistSpecialty,
  specialistIcon,
  theme,
}: MessageBubbleProps) {
  const isUser = sender === 'user';

  const avatarWrapper = isUser
    ? 'hidden'
    : `w-10 h-10 ${theme?.avatarBg ?? 'bg-primary dark:bg-blue-600'} rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner`;

  const assistantBubble = theme?.assistantBubble ?? 'bg-gray-100 dark:bg-gray-700';
  const assistantText = theme?.assistantText ?? 'text-secondary dark:text-white';
  const userBubble = `${theme?.userBubble ?? 'bg-primary dark:bg-blue-600'} ${theme?.userText ?? 'text-white'}`;
  const userText = theme?.userText ?? 'text-white';
  const timestampText = theme?.accent ?? 'text-gray-500 dark:text-gray-400';

  return (
    <div className={`flex space-x-3 animate-in slide-in-from-bottom-2 duration-300 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className={avatarWrapper}>
          {specialistIcon ? (
            <i className={`${specialistIcon} ${theme?.avatarText ?? 'text-white'} text-lg`}></i>
          ) : (
            <img
              src="/MATE/Mate48x48.png"
              alt="Mate Logo"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/MATE/Mate48x48.png';
              }}
            />
          )}
        </div>
      )}

      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl p-4 max-w-xs ${
            isUser ? userBubble : assistantBubble
          } ${isUser ? 'rounded-tr-md' : 'rounded-tl-md'}`}
        >
          <p className={`leading-relaxed ${isUser ? userText : assistantText}`}>{content}</p>
        </div>

        {!isUser && (timestamp || specialistName) && (
          <div className="flex items-center justify-start mt-1 px-1 gap-2">
            {timestamp && (
              <span className={`text-xs ${timestampText} mr-2 min-w-[40px] text-left`}>
                {formatTimestamp(timestamp)}
              </span>
            )}
            {specialistName && (
              <span className={`text-xs ${timestampText} text-right whitespace-nowrap flex items-center gap-1`}>
                {specialistName.replace(/\s*\([^)]*\)/g, '')}
                {specialistSpecialty && (
                  <>
                    <span className="opacity-60">•</span>
                    <span className="opacity-80">{specialistSpecialty}</span>
                  </>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
