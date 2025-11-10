export function StatusIndicator() {
  const isOnline = navigator.onLine;
  
  return (
    <div className="flex items-center gap-2 text-sm h-6">
      <div 
        className={`w-2 h-2 rounded-full self-center ${
          isOnline ? 'bg-green-400' : 'bg-red-400'
        }`}
      />
      <span className={`${isOnline ? 'text-green-400' : 'text-red-400'} flex items-center h-6`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
