import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SpecialistCard } from "@/components/specialist-card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Specialist } from "@/lib/specialists";

export default function Specialists() {
  const [, setLocation] = useLocation();
  const [showAll, setShowAll] = useState(false);

  const { data: specialists = [], isLoading } = useQuery<Specialist[]>({
    queryKey: ['/api/specialists'],
    queryFn: () => fetch('/api/specialists', { credentials: 'include' }).then(res => res.json())
  });

  const createConversationMutation = useMutation({
    mutationFn: async (specialistId: number) => {
      const response = await apiRequest('POST', '/api/conversations', {
        specialistId,
        title: 'New Conversation'
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      setLocation(`/chat/${conversation.id}`);
    }
  });

  const handleSpecialistSelect = (specialist: Specialist) => {
    createConversationMutation.mutate(specialist.id);
  };

  const displayedSpecialists = showAll ? specialists : specialists.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col modern-bg-blobs">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto glass-card shadow-2xl min-h-screen relative flex flex-col pb-20">
        {/* Header */}
        <header className="bg-primary/80 dark:bg-gray-800/80 text-white p-4 shadow-lg sticky top-0 z-10 glass-card">
          <div className="flex items-center justify-between min-h-[64px] h-16 md:h-20">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
                className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Specialists</h1>
                <p className="text-blue-200 dark:text-gray-300 text-sm">Choose your area of support</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Profile"
                title="Profile"
                onClick={() => setLocation('/profile')}
              >
                <i className="fas fa-user-circle text-xl"></i>
              </button>
              <button
                className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Settings"
                title="Settings"
                onClick={() => setLocation('/settings')}
              >
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-secondary dark:text-white mb-2">Choose Your Specialist</h2>
            <p className="text-gray-600 dark:text-gray-300">Select the area where you'd like some support:</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="modern-card p-4 h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 mb-6">
              {displayedSpecialists.map((specialist) => (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  onClick={handleSpecialistSelect}
                />
              ))}

              {!showAll && specialists.length > 6 && (
                <Button
                  onClick={() => setShowAll(true)}
                  variant="outline"
                  className="w-full modern-btn text-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Show {specialists.length - 6} More Specialists
                </Button>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
      {/* Bottom Navigation (Home first) */}
      <nav className="fixed bottom-0 left-0 right-0 glass-card modern-card bg-white/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex justify-around max-w-md mx-auto z-20">
        <button onClick={() => setLocation('/')} className="flex flex-col items-center py-2 px-4 modern-btn text-primary dark:text-blue-400" title="Home">
          {/* Home SVG icon (use your blue logo) */}
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><rect x="4" y="8" width="56" height="48" rx="14" fill="#2196F3"/><text x="32" y="42" textAnchor="middle" fontSize="20" fill="#fff" fontFamily="Inter, Arial, sans-serif">Mate</text></svg>
          <span className="text-xs">Home</span>
        </button>
        <button onClick={() => setLocation('/chat/new')} className="flex flex-col items-center py-2 px-4 modern-btn text-primary dark:text-blue-400" title="Chat">
          {/* Chat SVG icon */}
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><rect x="4" y="8" width="56" height="48" rx="14" fill="url(#chatGradient)"/><text x="32" y="42" textAnchor="middle" fontSize="28" fill="#fff" fontFamily="Inter, Arial, sans-serif">M</text><defs><linearGradient id="chatGradient" x1="4" y1="8" x2="60" y2="56" gradientUnits="userSpaceOnUse"><stop stopColor="#4F8CFF"/><stop offset="1" stopColor="#E05EFF"/></linearGradient></defs></svg>
          <span className="text-xs">Chat</span>
        </button>
        <button onClick={() => setLocation('/notes')} className="flex flex-col items-center py-2 px-4 modern-btn text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors" title="Notes">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><rect x="4" y="8" width="56" height="48" rx="14" fill="url(#noteGradient)"/><path d="M16 24h32M16 32h32M16 40h20" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><defs><linearGradient id="noteGradient" x1="4" y1="8" x2="60" y2="56" gradientUnits="userSpaceOnUse"><stop stopColor="#4F8CFF"/><stop offset="1" stopColor="#E05EFF"/></linearGradient></defs></svg>
          <span className="text-xs">Notes</span>
        </button>
        <button onClick={() => setLocation('/profile')} className="flex flex-col items-center py-2 px-4 modern-btn text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors" title="Profile">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="28" r="10" fill="url(#profileGradient)"/><rect x="16" y="42" width="32" height="10" rx="5" fill="url(#profileGradient)"/><defs><linearGradient id="profileGradient" x1="16" y1="18" x2="48" y2="52" gradientUnits="userSpaceOnUse"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#4F8CFF"/></linearGradient></defs></svg>
          <span className="text-xs">Profile</span>
        </button>
      </nav>
    </div>
  );
}
