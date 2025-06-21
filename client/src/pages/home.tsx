import { ArrowRight, Shield, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-xl min-h-screen relative">
        {/* Header */}
        <header className="bg-primary text-white p-4 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Mate</h1>
              <p className="text-blue-200 text-sm">Choose your specialist</p>
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

        {/* Welcome Content */}
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center">
              <i className="fas fa-comments text-4xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-3">Welcome to Mate</h2>
            <p className="text-gray-600 leading-relaxed">
              Your judgment-free space to chat with mental health specialists backed by PhD-level academic research.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Shield className="text-primary text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary">100% Confidential</h3>
                  <p className="text-sm text-gray-600">Your conversations stay private</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <GraduationCap className="text-accent text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary">PhD-Level Expertise</h3>
                  <p className="text-sm text-gray-600">Backed by academic research</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Clock className="text-success text-xl w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-secondary">24/7 Available</h3>
                  <p className="text-sm text-gray-600">Get support whenever you need it</p>
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
