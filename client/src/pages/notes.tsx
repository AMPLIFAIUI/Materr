
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ArrowLeft, MessageSquare, Save, ChevronDown, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface SavedNote {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
}

export default function NotesPage() {
  const [notes, setNotes] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const maxWords = 500;
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Load saved notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mateNotesList");
    if (saved) {
      const notesList = JSON.parse(saved) as SavedNote[];
      setSavedNotes(notesList.map(note => ({
        ...note,
        lastModified: new Date(note.lastModified)
      })));
    }
    // Load current draft or most recent note
    const currentDraft = localStorage.getItem("mateNotes");
    if (currentDraft) {
      setNotes(currentDraft);
      setWordCount(currentDraft.trim().split(/\s+/).filter(Boolean).length);
    }
  }, []);

  // Update word count on notes change
  useEffect(() => {
    setWordCount(notes.trim().split(/\s+/).filter(Boolean).length);
  }, [notes]);

  const generateNoteTitle = (content: string): string => {
    const firstLine = content.trim().split('\n')[0];
    const words = firstLine.split(' ').slice(0, 5).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words || 'Untitled Note';
  };

  const saveNoteToList = (title?: string) => {
    if (!notes.trim()) {
      toast({
        title: "No content",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    const noteTitle = title || generateNoteTitle(notes);
    const noteId = currentNoteId || Date.now().toString();
    
    const newNote: SavedNote = {
      id: noteId,
      title: noteTitle,
      content: notes,
      lastModified: new Date()
    };

    const updatedNotes = currentNoteId 
      ? savedNotes.map(note => note.id === currentNoteId ? newNote : note)
      : [...savedNotes, newNote];

    setSavedNotes(updatedNotes);
    setCurrentNoteId(noteId);
    localStorage.setItem("mateNotesList", JSON.stringify(updatedNotes));
    localStorage.setItem("mateNotes", notes);

    toast({
      title: "Note saved",
      description: `"${noteTitle}" has been saved.`,
    });
  };

  const loadNote = (note: SavedNote) => {
    setNotes(note.content);
    setCurrentNoteId(note.id);
    setShowDropdown(false);
    localStorage.setItem("mateNotes", note.content);
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = savedNotes.filter(note => note.id !== noteId);
    setSavedNotes(updatedNotes);
    localStorage.setItem("mateNotesList", JSON.stringify(updatedNotes));
    
    if (currentNoteId === noteId) {
      setNotes("");
      setCurrentNoteId(null);
      localStorage.removeItem("mateNotes");
    }

    toast({
      title: "Note deleted",
      description: "Note has been deleted.",
    });
  };

  const startEditingTitle = (note: SavedNote) => {
    setEditingTitle(note.id);
    setNewTitle(note.title);
  };

  const saveNewTitle = (noteId: string) => {
    if (!newTitle.trim()) return;
    
    const updatedNotes = savedNotes.map(note => 
      note.id === noteId ? { ...note, title: newTitle.trim() } : note
    );
    setSavedNotes(updatedNotes);
    localStorage.setItem("mateNotesList", JSON.stringify(updatedNotes));
    setEditingTitle(null);
    
    toast({
      title: "Title updated",
      description: "Note title has been updated.",
    });
  };

  const createNewNote = () => {
    setNotes("");
    setCurrentNoteId(null);
    localStorage.removeItem("mateNotes");
    setShowDropdown(false);
  };
  const handleSendToChat = () => {
    if (!notes.trim()) {
      toast({
        title: "No content",
        description: "Please write something before sending to chat.",
        variant: "destructive",
      });
      return;
    }
    
    // Store the note content to be picked up by chat
    localStorage.setItem("chatDraft", notes.trim());
    
    toast({
      title: "Sent to chat",
      description: "Your note has been added to the chat input.",
    });
    
    // Navigate to chat (conversation 1 by default)
    setLocation("/chat/1");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveNoteToList();
    }
  };

  const getCurrentNoteTitle = () => {
    if (currentNoteId) {
      const current = savedNotes.find(note => note.id === currentNoteId);
      return current?.title || 'Current Note';
    }
    return notes.trim() ? generateNoteTitle(notes) : 'New Note';
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Animated background */}
      <div className="modern-bg-blobs"></div>
      
      <div className="w-full max-w-md glass-card shadow-2xl p-6 relative flex flex-col min-h-screen z-10">
        {/* Header with back button and dropdown */}
        <header className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 dark:from-gray-800 dark:to-gray-900 text-white px-4 py-3 pt-safe shadow-lg sticky top-0 z-10 rounded-t-3xl glass-card">
          <div className="flex items-center justify-between min-h-[64px] h-16 md:h-20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
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
                <h1 className="text-xl font-semibold leading-tight">Notes</h1>
                <p className="text-blue-200 dark:text-gray-300 text-sm">{wordCount}/{maxWords} words</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 text-sm font-medium bg-blue-500/30 hover:bg-blue-600/40 dark:bg-gray-700/80 dark:hover:bg-gray-600/80 px-4 py-3 rounded-xl transition-colors min-h-[44px] glass-card border border-white/20"
                title="Select note"
              >
                {getCurrentNoteTitle()}
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`} />
              </button>
              {/* Notes Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-white/20 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto backdrop-blur-lg">
                  {/* New Note Option */}
                  <button
                    onClick={createNewNote}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-2 border-b border-white/10"
                    title="Create new note"
                  >
                    <Plus className="w-4 h-4 text-blue-300" />
                    <span className="font-medium">New Note</span>
                  </button>
                  
                  {/* Saved Notes */}
                  {savedNotes.map((note) => (
                    <div key={note.id} className="group">
                      {editingTitle === note.id ? (
                        <div className="px-3 py-2 flex items-center gap-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveNewTitle(note.id);
                              if (e.key === 'Escape') setEditingTitle(null);
                            }}
                            className="text-sm glass-card border-white/20"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => saveNewTitle(note.id)} variant="default"
                            className="bg-blue-500 hover:bg-blue-600">
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between hover:bg-white/10 transition-colors">
                          <button
                            onClick={() => loadNote(note)}
                            onTouchStart={(e) => {
                              // Long press for mobile
                              const touch = setTimeout(() => {
                                e.preventDefault();
                                // Vibrate if available
                                if ('vibrate' in navigator) {
                                  navigator.vibrate(50);
                                }
                                
                                // Show actions menu
                                const actionsMenu = document.createElement('div');
                                actionsMenu.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50';
                                actionsMenu.innerHTML = `
                                  <div class="glass-card rounded-xl p-4 w-64 space-y-2">
                                    <h3 class="text-center font-medium mb-2">${note.title}</h3>
                                    <button id="edit-note" class="w-full flex items-center gap-2 bg-blue-500/30 hover:bg-blue-500/50 p-3 rounded-lg">
                                      <i class="fas fa-edit text-blue-400"></i>
                                      <span>Edit Title</span>
                                    </button>
                                    <button id="delete-note" class="w-full flex items-center gap-2 bg-red-500/30 hover:bg-red-500/50 p-3 rounded-lg">
                                      <i class="fas fa-trash-alt text-red-400"></i>
                                      <span>Delete Note</span>
                                    </button>
                                    <button id="cancel-note" class="w-full flex items-center justify-center p-3">
                                      <span>Cancel</span>
                                    </button>
                                  </div>
                                `;
                                document.body.appendChild(actionsMenu);
                                
                                const closeMenu = () => document.body.removeChild(actionsMenu);
                                
                                document.getElementById('edit-note')?.addEventListener('click', () => {
                                  closeMenu();
                                  startEditingTitle(note);
                                });
                                
                                document.getElementById('delete-note')?.addEventListener('click', () => {
                                  closeMenu();
                                  if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
                                    deleteNote(note.id);
                                  }
                                });
                                
                                document.getElementById('cancel-note')?.addEventListener('click', closeMenu);
                                actionsMenu.addEventListener('click', (e) => {
                                  if (e.target === actionsMenu) closeMenu();
                                });
                              }, 500);
                              
                              e.currentTarget.addEventListener('touchend', () => clearTimeout(touch), { once: true });
                              e.currentTarget.addEventListener('touchmove', () => clearTimeout(touch), { once: true });
                            }}
                            className="flex-1 text-left px-4 py-3"
                            title={`Load note: ${note.title}`}
                          >
                            <div className="font-medium truncate">{note.title}</div>
                            <div className="text-xs text-blue-200/70">
                              {new Date(note.lastModified).toLocaleDateString()}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 pr-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditingTitle(note)}
                              className="p-2 hover:bg-blue-500/30 rounded-lg"
                              title="Rename note"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-300" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
                                  deleteNote(note.id);
                                }
                              }}
                              className="p-2 hover:bg-red-500/30 rounded-lg"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {savedNotes.length === 0 && (
                    <div className="px-4 py-4 text-blue-200/70 text-sm text-center">
                      No saved notes yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="p-6 flex-1 flex flex-col">
        {/* Progress bar and word count */}
        <div className="mb-2">
          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Word count: {wordCount} / {maxWords}</span>
            <span>{maxWords - wordCount} words left</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${wordCount < maxWords ? 'bg-blue-400' : 'bg-red-500'} ${
                wordCount === 0 ? 'w-0' :
                wordCount < maxWords * 0.2 ? 'w-1/5' :
                wordCount < maxWords * 0.4 ? 'w-2/5' :
                wordCount < maxWords * 0.6 ? 'w-3/5' :
                wordCount < maxWords * 0.8 ? 'w-4/5' :
                wordCount < maxWords ? 'w-full' : 'w-full'
              }`}
            />
          </div>
        </div>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={12}
          placeholder="Write anything on your mind..."
          className="w-full modern-input glass-card font-mono resize-vertical min-h-[200px] border-white/20"
        />
        
        {/* Action buttons */}
        <div className="flex justify-between mt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => setNotes("")}
            className="modern-btn glass-card bg-purple-500/30 hover:bg-purple-500/50 text-white border-white/20"
          >
            Clear
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => saveNoteToList()}
              className="modern-btn glass-card bg-blue-500/40 hover:bg-blue-500/60 text-white border-white/20"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleSendToChat}
              className="modern-btn glass-card bg-green-500/40 hover:bg-green-500/60 text-white border-white/20"
              disabled={!notes.trim()}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send to Chat
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">Your notes are private and only stored on this device.</p>
        </div>
        </div>
      <BottomNav />
    </div>
  );
}
