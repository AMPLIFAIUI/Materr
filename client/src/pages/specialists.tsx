import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SpecialistCard } from "@/components/specialist-card";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { loadSpecialists } from '@/lib/specialists';
import { ProfileIconWithName } from "@/components/ProfileIconWithName";

export default function Specialists() {
  const [, setLocation] = useLocation();
  const [showAll, setShowAll] = useState(false);

  // Dynamically load specialists (browser compatible)
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    loadSpecialists()
      .then((data) => {
        if (mounted) {
          setSpecialists(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadError(true);
          setIsLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const createConversationMutation = useMutation({
    mutationFn: async (specialistKey: string) => {
      const response = await apiRequest('POST', '/api/conversations', {
        specialistKey,
        title: 'New Conversation'
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      setLocation(`/chat/${conversation.id}`);
    },
    onError: (error, specialist) => {
      setLocation(`/chat/new?specialist=${specialist}`);
    }
  });

  const handleSpecialistSelect = (specialist) => {
    // Store selected specialist for chat
    localStorage.setItem('selectedSpecialist', JSON.stringify(specialist));
    // Navigate directly to chat with specialist context
    setLocation(`/chat/new?specialist=${specialist.key}`);
  };

  // Show all if <= 8, else show 8 with a Show More button for the rest
  const displayedSpecialists = showAll || specialists.length <= 8 ? specialists : specialists.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated background */}
      <div className="modern-bg-blobs"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="max-w-md w-full mx-auto glass-card shadow-2xl min-h-screen relative flex flex-col pb-20">
        {/* Header */}
        <header className="bg-primary/80 dark:bg-gray-800/80 text-white p-4 pt-safe shadow-lg sticky top-0 z-10 glass-card">
          <div className="flex items-center justify-between min-h-[60px]">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
                className="p-3 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center interactive cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <img 
                  src="./MATE/Mate48x48.png" 
                  alt="Mate Logo" 
                  className="w-8 h-8 rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('assets')) {
                      target.src = './assets/MATE/Mate48x48.png';
                    }
                  }}
                />
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Specialists</h1>
                  <p className="text-blue-200 dark:text-gray-300 text-sm">Choose your area of support</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ProfileIconWithName onClick={() => setLocation('/profile')} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Choose Your Specialist</h2>
            <p className="text-gray-300">Select the area where you'd like some support:</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="modern-card p-4 h-20 animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center text-red-400 py-8">
              <p>Could not load specialists. Please try again later.</p>
            </div>
          ) : displayedSpecialists.length === 0 ? (
            <div className="text-center text-blue-200 py-8">
              <p>No specialists available at the moment. Please check back soon.</p>
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

              {!showAll && specialists.length > 8 && (
                <Button
                  onClick={() => setShowAll(true)}
                  variant="outline"
                  className="w-full modern-btn text-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Show {specialists.length - 8} More Specialists
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Replace the custom nav with BottomNav */}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
