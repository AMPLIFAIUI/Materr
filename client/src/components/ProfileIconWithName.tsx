export function ProfileIconWithName({ onClick }: { onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px]">
      <button
        className="p-3 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center interactive cursor-pointer rounded-full"
        title="Profile"
        onClick={onClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-blue-200 dark:text-blue-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25a7.75 7.75 0 0115.5 0v.25a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.25z" />
        </svg>
      </button>
    </div>
  );
}
