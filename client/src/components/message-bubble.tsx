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
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <i className="fas fa-user-md text-white text-xs"></i>
        </div>
      )}
      
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl p-4 max-w-xs ${
            isUser
              ? 'bg-primary text-white rounded-tr-md'
              : 'bg-gray-100 rounded-tl-md'
          }`}
        >
          <p className={isUser ? 'text-white' : 'text-secondary'}>{content}</p>
        </div>
        
        {!isUser && timestamp && (
          <p className="text-xs text-gray-500 mt-1 ml-2">
            {specialistName && specialistSpecialty && (
              <span>{specialistName} - {specialistSpecialty} • </span>
            )}
            {format(timestamp, 'p')}
          </p>
        )}
      </div>
    </div>
  );
}
