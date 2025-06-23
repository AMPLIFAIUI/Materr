
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
    <div className="min-h-screen flex flex-col items-center justify-center modern-bg-blobs">
      <div className="w-full max-w-md glass-card shadow-2xl p-6 relative flex flex-col min-h-screen">
        {/* Header with back button and dropdown */}
        <div className="flex items-center justify-between min-h-[64px] h-16 md:h-20 mb-4">
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
            className="p-2 modern-btn rounded-full flex items-center justify-center"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-black dark:text-yellow-400" />
          </button>
          <div className="flex items-center gap-2 flex-1 justify-center">
            {/* Uniform SVG logo for Notes */}
            <span className="inline-block w-8 h-8">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="8" width="56" height="48" rx="14" fill="url(#noteGradient)" />
                <path d="M16 24h32M16 32h32M16 40h20" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="noteGradient" x1="4" y1="8" x2="60" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4F8CFF"/>
                    <stop offset="1" stopColor="#E05EFF"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 text-lg font-bold hover:bg-yellow-100 dark:hover:bg-yellow-700 px-2 py-1 rounded transition-colors"
                title="Select note"
              >
                {getCurrentNoteTitle()}
                <ChevronDown className="w-4 h-4" />
              </button>
              {/* Notes Dropdown */}              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-yellow-50 dark:bg-gray-700 border border-yellow-400 dark:border-yellow-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {/* New Note Option */}                  <button
                    onClick={createNewNote}
                    className="w-full px-3 py-2 text-left hover:bg-yellow-50 dark:hover:bg-yellow-800 flex items-center gap-2 border-b border-yellow-300 dark:border-yellow-700"
                  >
                    <Plus className="w-4 h-4 text-yellow-700" />
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
                            className="text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => saveNewTitle(note.id)}>
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-800">
                          <button
                            onClick={() => loadNote(note)}
                            className="flex-1 text-left"
                          >
                            <div className="font-medium truncate">{note.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {note.lastModified.toLocaleDateString()}
                            </div>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditingTitle(note)}
                              className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-700 rounded"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(note.id);
                              }}
                              className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {savedNotes.length === 0 && (
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm text-center">
                      No saved notes yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
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
          className="w-full modern-input font-mono resize-vertical min-h-[200px]"
        />
        
        {/* Action buttons */}
        <div className="flex justify-between mt-4 gap-2">          <Button
            variant="outline"
            onClick={() => setNotes("")}
            className="modern-btn bg-yellow-400/80 text-yellow-900 border-yellow-500 hover:bg-yellow-300 dark:hover:bg-yellow-700"
          >
            Clear
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => saveNoteToList()}
              className="modern-btn bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleSendToChat}
              className="modern-btn bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!notes.trim()}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send to Chat
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">Your notes are private and only stored on this device.</p>
      </div>
      <BottomNav />
    </div>
  );
}
