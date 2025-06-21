import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SpecialistCard } from "@/components/specialist-card";
import { Button } from "@/components/ui/button";
import type { Specialist } from "@/lib/specialists";

export default function Specialists() {
  const [, setLocation] = useLocation();
  const [showAll, setShowAll] = useState(false);

  const { data: specialists = [], isLoading } = useQuery<Specialist[]>({
    queryKey: ['/api/specialists']
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-xl min-h-screen relative">
        {/* Header */}
        <header className="bg-primary text-white p-4 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setLocation('/')}
                className="p-2 hover:bg-blue-600 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Specialists</h1>
                <p className="text-blue-200 text-sm">Choose your area of support</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-blue-600 rounded-full transition-colors">
                <i className="fas fa-user-circle text-xl"></i>
              </button>
              <button className="p-2 hover:bg-blue-600 rounded-full transition-colors">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-secondary mb-2">Choose Your Specialist</h2>
            <p className="text-gray-600">Select the area where you'd like some support:</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl p-4 h-20 animate-pulse" />
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
                  className="w-full bg-gray-100 text-secondary py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors border-gray-200"
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
  );
}
