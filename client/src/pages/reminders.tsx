import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Bell, Save, X, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface Reminder {
  id: number;
  title: string;
  message: string;
  time: string;
  days: string[];
  enabled: boolean;
}

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 1,
    title: "Daily Check-in",
    message: "How are you feeling today?",
    time: "09:00",
    days: ["mon", "tue", "wed", "thu", "fri"],
    enabled: false
  },
  {
    id: 2,
    title: "Meditation",
    message: "Take a moment for mindfulness",
    time: "18:00",
    days: ["mon", "wed", "fri"],
    enabled: false
  },
  {
    id: 3,
    title: "Gratitude Journal",
    message: "What are you grateful for today?",
    time: "21:00",
    days: ["sun", "tue", "thu", "sat"],
    enabled: false
  }
];

const DAYS_OF_WEEK = [
  { value: "sun", label: "Sun" },
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" }
];

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    time: '09:00',
    days: [] as string[],
    enabled: true
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load reminders from localStorage or use defaults
    const stored = localStorage.getItem('mate_reminders');
    if (stored) {
      setReminders(JSON.parse(stored));
    } else {
      // First time: use preset reminders but disabled
      setReminders(DEFAULT_REMINDERS);
      localStorage.setItem('mate_reminders', JSON.stringify(DEFAULT_REMINDERS));
    }
  }, []);

  const saveReminders = (newReminders: Reminder[]) => {
    localStorage.setItem('mate_reminders', JSON.stringify(newReminders));
    setReminders(newReminders);
  };

  const addReminder = () => {
    setFormData({ 
      title: '', 
      message: '', 
      time: '09:00', 
      days: ['mon', 'wed', 'fri'], 
      enabled: true 
    });
    setEditingReminder(null);
    setIsEditing(true);
  };

  const editReminder = (reminder: Reminder) => {
    setFormData({
      title: reminder.title,
      message: reminder.message,
      time: reminder.time,
      days: [...reminder.days],
      enabled: reminder.enabled
    });
    setEditingReminder(reminder);
    setIsEditing(true);
  };

  const saveReminder = () => {
    if (!formData.title.trim()) {
      alert('Please enter a reminder title');
      return;
    }

    // Check if we're at the reminder limit (10) when adding a new reminder
    if (!editingReminder && reminders.length >= 10) {
      alert('Maximum of 10 reminders allowed');
      return;
    }

    let newReminders: Reminder[];
    
    if (editingReminder) {
      // Editing existing reminder
      newReminders = reminders.map(r => 
        r.id === editingReminder.id 
          ? { ...editingReminder, ...formData }
          : r
      );
    } else {
      // Adding new reminder
      const newReminder: Reminder = {
        id: Date.now(),
        title: formData.title,
        message: formData.message,
        time: formData.time,
        days: formData.days.length > 0 ? formData.days : ['mon'],
        enabled: formData.enabled
      };
      newReminders = [...reminders, newReminder];
    }

    saveReminders(newReminders);
    setIsEditing(false);
    setEditingReminder(null);
    setFormData({ title: '', message: '', time: '09:00', days: [], enabled: true });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingReminder(null);
    setFormData({ title: '', message: '', time: '09:00', days: [], enabled: true });
  };

  const deleteReminder = (id: number) => {
    const newReminders = reminders.filter(r => r.id !== id);
    saveReminders(newReminders);
  };

  const toggleReminder = (id: number, enabled: boolean) => {
    const newReminders = reminders.map(r => 
      r.id === id ? { ...r, enabled } : r
    );
    saveReminders(newReminders);
  };

  const toggleDay = (day: string) => {
    if (formData.days.includes(day)) {
      setFormData({
        ...formData,
        days: formData.days.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        days: [...formData.days, day]
      });
    }
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
            onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/settings')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center mb-8">
          <Bell className="w-16 h-16 mx-auto mb-4 text-primary dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-secondary dark:text-white mb-2">My Reminders</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Set up reminders for self-care and check-ins (Max: 10).
          </p>
        </div>

        {/* Add/Edit Reminder Form */}
        {isEditing && (
          <Card className="glass-card border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Reminder title"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="message" className="text-gray-300">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Optional message"
                  className="bg-gray-800 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="time" className="text-gray-300">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-gray-300 block mb-2">Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={formData.days.includes(day.value) ? "default" : "outline"}
                      className={`px-3 py-1 text-xs ${
                        formData.days.includes(day.value) 
                          ? "bg-blue-500 hover:bg-blue-600" 
                          : "border-gray-500 text-gray-300"
                      }`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  id="reminder-active"
                />
                <Label htmlFor="reminder-active" className="text-gray-300">Active</Label>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={saveReminder} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={cancelEdit} variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {reminders.map((reminder) => (
            <Card 
              key={reminder.id} 
              className={`glass-card ${
                reminder.enabled 
                  ? "border-blue-500/30" 
                  : "border-gray-500/30 opacity-75"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-white">{reminder.title}</h3>
                  </div>
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                    id={`reminder-${reminder.id}`}
                  />
                </div>
                
                <div className="ml-6">
                  {reminder.message && (
                    <p className="text-gray-300 text-sm mb-2">{reminder.message}</p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{reminder.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map(day => (
                        <span 
                          key={day.value}
                          className={`text-xs px-1 ${
                            reminder.days.includes(day.value)
                              ? "text-blue-400"
                              : "text-gray-600"
                          }`}
                        >
                          {day.label[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editReminder(reminder)}
                    className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={addReminder}
            variant="outline"
            className="w-full border-dashed border-gray-500 text-gray-300 hover:bg-gray-800"
            disabled={reminders.length >= 10}
          >
            <Plus className="w-4 h-4 mr-2" />
            {reminders.length >= 10 ? 'Reminder Limit Reached' : 'Add Reminder'}
          </Button>
        </div>

        <div className="p-4 mt-6 bg-blue-900/20 rounded-lg border border-blue-800/30">
          <h3 className="text-blue-400 font-medium mb-2">About Reminders</h3>
          <p className="text-sm text-gray-300">
            Reminders will send you notifications at the specified times on the days you select.
            Make sure to give MATE permission to send notifications for this feature to work properly.
          </p>
        </div>

      </div>
      </div>
    </div>
  );
}
