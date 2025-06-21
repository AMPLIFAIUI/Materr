import { ArrowRight, Shield, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl min-h-screen relative">
        {/* Header */}
        <header className="bg-primary dark:bg-gray-800 text-white p-4 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Mate</h1>
              <p className="text-blue-200 dark:text-gray-300 text-sm">Choose your specialist</p>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors">
                <i className="fas fa-user-circle text-xl"></i>
              </button>
              <button className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Welcome Content */}
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-primary to-blue-700 dark:from-blue-600 dark:to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-comment text-5xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-secondary dark:text-white mb-3">Welcome to Mate</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your judgment-free space to chat with mental health specialists backed by PhD-level academic research.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Shield className="text-primary dark:text-blue-400 text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary dark:text-white">100% Confidential</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Your conversations stay private</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <GraduationCap className="text-accent dark:text-amber-400 text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary dark:text-white">PhD-Level Expertise</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Backed by academic research</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
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
            onClick={() => setLocation('/specialists')}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg mt-8 hover:bg-blue-700 transition-colors shadow-lg h-auto"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
