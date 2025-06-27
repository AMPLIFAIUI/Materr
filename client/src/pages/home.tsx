import { ArrowRight, Shield, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ProfileIconWithName } from "@/components/ProfileIconWithName";
import { useEffect, useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const onboarded = localStorage.getItem("mate-onboarded");
      if (!onboarded) setShowOnboarding(true);
    }
  }, []);

  const handleSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem("mate-onboarded", "1");
  };

  const handleGoTo = (path: string) => {
    setShowOnboarding(false);
    localStorage.setItem("mate-onboarded", "1");
    setLocation(path);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated background */}
      <div className="modern-bg-blobs"></div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {showOnboarding && (
          <div className="max-w-md w-full mx-auto glass-card shadow-2xl p-8 mt-12 mb-8 flex flex-col items-center gap-6">
            <h2 className="text-2xl font-bold text-blue-200 mb-2">
              Welcome! Let's get started
            </h2>
            <p className="text-white/80 mb-4 text-center">
              To personalize your experience, please set up the following. You can
              skip this step at any time.
            </p>
            <div className="flex flex-col gap-4 w-full">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                onClick={() => handleGoTo("/profile")}
              >
                Set Your Name
              </button>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                onClick={() => handleGoTo("/settings")}
              >
                Choose Your Region
              </button>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                onClick={() => handleGoTo("/emergency-contacts")}
              >
                Add Emergency Contacts
              </button>
            </div>
            <button
              className="mt-6 text-blue-200 hover:text-blue-400 text-lg flex items-center gap-2"
              onClick={handleSkip}
            >
              Skip{" "}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="max-w-md w-full mx-auto glass-card shadow-2xl min-h-screen relative flex flex-col pb-20">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 dark:from-gray-800 dark:to-gray-900 text-white px-4 py-3 pt-safe shadow-lg sticky top-0 z-10 rounded-b-3xl glass-card">
            <div className="flex items-center justify-between min-h-[64px] h-16 md:h-20">
              <div className="flex items-center gap-3">
                <div className="flex flex-col justify-center -mt-2">
                  <img
                    src="./MATE/Mate48x48.png"
                    alt="Mate Logo"
                    className="w-8 h-8 rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes("assets")) {
                        target.src = "./assets/MATE/Mate48x48.png";
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center -mt-2">
                  <h1 className="text-xl font-semibold leading-tight">Mate</h1>
                </div>
                <span className="ml-4">
                  <StatusIndicator />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ProfileIconWithName onClick={() => setLocation("/profile")} />
                <button
                  className="p-3 hover:bg-blue-600 dark:hover:bg-blue-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center interactive cursor-pointer"
                  title="Settings"
                  onClick={() => setLocation("/settings")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-7 h-7 text-blue-200 dark:text-blue-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.01 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.572-1.01c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.572c-.94-1.543.826-3.31 2.37-2.37.996.608 2.265.07 2.572-1.01z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Welcome Content moved to top below header */}
          <div className="p-6 flex flex-col">
            <div className="text-center mb-8">
              <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-primary to-blue-700 dark:from-blue-600 dark:to-blue-800 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="./MATE/Mate192x192.png"
                  alt="Mate Logo"
                  className="w-32 h-32 object-contain"
                  onError={(e) => {
                    // Fallback to a different path if the first one fails
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes("assets")) {
                      target.src = "./assets/MATE/Mate192x192.png";
                    }
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold text-secondary dark:text-white mb-3">
                G'day Mate
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your judgment-free space to chat with mental health specialists
                backed by PhD-level academic research.
              </p>
            </div>
            <div className="space-y-4">
              <div className="modern-card p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="text-primary dark:text-blue-400 text-xl w-6 h-6" />
                  <div>
                    <h3 className="font-semibold text-secondary dark:text-white">
                      100% Confidential
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Your conversations stay private
                    </p>
                  </div>
                </div>
              </div>
              <div className="modern-card p-4">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="text-accent dark:text-amber-400 text-xl w-6 h-6" />
                  <div>
                    <h3 className="font-semibold text-secondary dark:text-white">
                      PhD-Level Expertise
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Backed by academic research
                    </p>
                  </div>
                </div>
              </div>
              <div className="modern-card p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="text-success dark:text-green-400 text-xl w-6 h-6" />
                  <div>
                    <h3 className="font-semibold text-secondary dark:text-white">
                      24/7 Available
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get support whenever you need it
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Get Started button moved above BottomNav */}
          <div className="px-6 pb-10 pt-8">
            <Button
              onClick={() => setLocation("/specialists")}
              className="w-full modern-btn text-lg h-auto min-h-[56px] interactive relative z-10 cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)",
                color: "#fff",
                border: "none",
              }}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
