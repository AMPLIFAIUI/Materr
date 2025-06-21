export function TypingIndicator() {
  return (
    <div className="flex space-x-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
        <i className="fas fa-comment text-white text-xs"></i>
      </div>
      <div className="flex-1">
        <div className="bg-gray-100 rounded-2xl rounded-tl-md p-4 max-w-xs">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
