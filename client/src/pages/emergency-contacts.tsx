import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Shield, Phone, Save, X } from 'lucide-react';
import type { EmergencyContact } from '@/lib/crisisDetection';
import EmergencyPermissionsStatus from '@/components/EmergencyPermissionsStatus';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: 'family' as 'family' | 'friend' | 'professional' | 'other'
  });

  useEffect(() => {
    const stored = localStorage.getItem('emergencyContacts_1');
    if (stored) {
      setContacts(JSON.parse(stored));
    }
  }, []);

  const saveContacts = (newContacts: EmergencyContact[]) => {
    localStorage.setItem('emergencyContacts_1', JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const addContact = () => {
    setFormData({ name: '', phone: '', relationship: 'family' });
    setEditingContact(null);
    setIsEditing(true);
  };

  const editContact = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship
    });
    setEditingContact(contact);
    setIsEditing(true);
  };

  const saveContact = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please fill in all fields');
      return;
    }

    // Check if we're at the contact limit (10) when adding a new contact
    if (!editingContact && contacts.length >= 10) {
      alert('Maximum of 10 emergency contacts allowed');
      return;
    }

    let newContacts: EmergencyContact[];
    
    if (editingContact) {
      // Editing existing contact
      newContacts = contacts.map(c => 
        c.id === editingContact.id 
          ? { ...editingContact, ...formData }
          : c
      );
    } else {
      // Adding new contact
      const newContact: EmergencyContact = {
        id: Date.now(),
        name: formData.name,
        phone: formData.phone,
        relationship: formData.relationship,
        isPrimary: contacts.length === 0, // First contact is primary
        verified: false
      };
      newContacts = [...contacts, newContact];
    }

    saveContacts(newContacts);
    setIsEditing(false);
    setEditingContact(null);
    setFormData({ name: '', phone: '', relationship: 'family' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingContact(null);
    setFormData({ name: '', phone: '', relationship: 'family' });
  };

  const deleteContact = (id: number) => {
    const newContacts = contacts.filter(c => c.id !== id);
    saveContacts(newContacts);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Animated background */}
      <div className="modern-bg-blobs"></div>
      
      <div className="flex-1 relative z-10 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive dark:text-red-400" />
          <h1 className="text-2xl font-bold text-secondary dark:text-white mb-2">Emergency Contacts</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Configure emergency contacts for crisis situations (Max: 10).
          </p>
        </div>

        <Card className="glass-card border-destructive/30 dark:border-red-500/30">
          <CardHeader>
            <CardTitle className="text-destructive dark:text-red-400 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              Crisis Detection Active
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>• AI monitors conversations for crisis indicators</p>
            <p>• Emergency contacts receive alerts with your location</p>
            <p>• Authorities contacted if no response within 30 minutes</p>
          </CardContent>
        </Card>

        <EmergencyPermissionsStatus />

        {/* Add/Edit Contact Form */}
        {isEditing && (
          <Card className="glass-card border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-blue-400 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contact name"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  type="tel"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="relationship" className="text-gray-300">Relationship</Label>
                <Select 
                  value={formData.relationship} 
                  onValueChange={(value: 'family' | 'friend' | 'professional' | 'other') => 
                    setFormData({ ...formData, relationship: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={saveContact} className="flex-1">
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
          {contacts.map((contact) => (
            <Card key={contact.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{contact.name}</h3>
                    <p className="text-gray-300 text-sm">{contact.phone}</p>
                    <p className="text-gray-400 text-xs capitalize">{contact.relationship}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editContact(contact)}
                      className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={addContact}
            variant="outline"
            className="w-full border-dashed border-gray-500 text-gray-300 hover:bg-gray-800"
            disabled={contacts.length >= 10}
          >
            <Plus className="w-4 h-4 mr-2" />
            {contacts.length >= 10 ? 'Contact Limit Reached' : 'Add Emergency Contact'}
          </Button>
        </div>

        <Button 
          variant="outline" 
          className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
          onClick={() => {
            alert('Test crisis alert sent to emergency contacts (simulation)');
          }}
        >
          <i className="fas fa-test-tube mr-2"></i>
          Test Crisis Alert System
        </Button>

      </div>
      </div>
    </div>
  );
}
