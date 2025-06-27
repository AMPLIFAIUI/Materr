import { format } from "date-fns";

interface MessageBubbleProps {
  content: string;
  sender: 'user' | 'specialist';
  timestamp?: Date;
  specialistName?: string;
  specialistSpecialty?: string;
}

export function MessageBubble({ 
  content, 
  sender, 
  timestamp, 
  specialistName, 
  specialistSpecialty 
}: MessageBubbleProps) {
  const isUser = sender === 'user';

  return (
    <div className={`flex space-x-3 animate-in slide-in-from-bottom-2 duration-300 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-primary dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <img
            src="/MATE/Mate48x48.png"
            alt="Mate Logo"
            className="w-6 h-6 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/MATE/Mate48x48.png';
            }}
          />
        </div>
      )}
      
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl p-4 max-w-xs ${
            isUser
              ? 'bg-primary dark:bg-blue-600 text-white rounded-tr-md'
              : 'bg-gray-100 dark:bg-gray-700 rounded-tl-md'
          }`}
        >
          <p className={isUser ? 'text-white' : 'text-secondary dark:text-white'}>{content}</p>
        </div>
        
        {/* Timestamp and specialist info on the same line for non-user messages */}
        {!isUser && (timestamp || specialistName) && (
          <div className="flex items-center justify-start mt-1 px-1 gap-2">
            {timestamp && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 min-w-[40px] text-left">
                {format(timestamp, 'p')}
              </span>
            )}
            {specialistName && (
              <span className="text-xs text-gray-500 dark:text-gray-300 text-right whitespace-nowrap">
                {specialistName.replace(/\s*\([^)]*\)/g, '')}
                {specialistSpecialty && (
                  <>
                    <span className="mx-1">&bull;</span>
                    <span>{specialistSpecialty}</span>
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
