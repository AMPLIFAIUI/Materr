
import { ArrowRight, Shield, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col modern-bg-blobs">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto glass-card shadow-2xl min-h-screen relative flex flex-col pb-20">
        {/* Header */}
        <header className="bg-primary/80 dark:bg-gray-800/80 text-white p-4 shadow-lg sticky top-0 z-10 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Mate</h1>
              <p className="text-blue-200 dark:text-gray-300 text-sm">Choose your specialist</p>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Profile"
              >
                <i className="fas fa-user-circle text-xl"></i>
              </button>
              <button
                className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Settings"
                onClick={() => setLocation('/settings')}
              >
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Welcome Content */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-primary to-blue-700 dark:from-blue-600 dark:to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-comment text-7xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-secondary dark:text-white mb-3">Welcome to Mate</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your judgment-free space to chat with mental health specialists backed by PhD-level academic research.
            </p>
          </div>

          <div className="space-y-4">
            <div className="modern-card p-4">
              <div className="flex items-center space-x-3">
                <Shield className="text-primary dark:text-blue-400 text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary dark:text-white">100% Confidential</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Your conversations stay private</p>
                </div>
              </div>
            </div>
            <div className="modern-card p-4">
              <div className="flex items-center space-x-3">
                <GraduationCap className="text-accent dark:text-amber-400 text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary dark:text-white">PhD-Level Expertise</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Backed by academic research</p>
                </div>
              </div>
            </div>
            <div className="modern-card p-4">
              <div className="flex items-center space-x-3">
                <Clock className="text-success dark:text-green-400 text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary dark:text-white">24/7 Available</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Get support whenever you need it</p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setLocation('/chat/new')}
            className="w-full modern-btn text-lg mt-8 h-auto"
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
