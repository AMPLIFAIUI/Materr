import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Save, Shield, Calendar, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Profile() {
  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '',
    email: '',
    joinDate: new Date().toLocaleDateString(),
    totalConversations: 0,
    preferredSpecialist: 'General Psychology'
  });
  const [, setLocation] = useLocation();

  const saveProfile = () => {
    localStorage.setItem('username', profile.username);
    alert('Profile saved successfully!');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated background */}
      <div className="modern-bg-blobs"></div>
      
      <div className="flex-1 relative z-10 p-4">
        <div className="max-w-md mx-auto space-y-6">
        
        <div className="flex items-center mb-4">
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
            title="Back"
            onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center mb-8">
          <User className="w-16 h-16 mx-auto mb-4 text-primary dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-secondary dark:text-white mb-2">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Manage your personal information and preferences.
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-primary dark:text-blue-400 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-600 dark:text-gray-300">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="Enter your username"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-gray-600 dark:text-gray-300">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="your@email.com"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            
            <Button onClick={saveProfile} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-success dark:text-green-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Account Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Joined:</span>
              <span className="text-gray-900 dark:text-white">{profile.joinDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Conversations:</span>
              <span className="text-gray-900 dark:text-white">{profile.totalConversations}</span>
            </div>
            <div className="flex justify-between">
              <span>Preferred Specialist:</span>
              <span className="text-gray-900 dark:text-white">{profile.preferredSpecialist}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/30 dark:border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-accent dark:text-yellow-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>• All data stored locally on your device</p>
            <p>• No external data transmission</p>
            <p>• Emergency contacts encrypted</p>
            <p>• Conversations are private and secure</p>
          </CardContent>
        </Card>

      </div>
      </div>
    </div>
  );
}