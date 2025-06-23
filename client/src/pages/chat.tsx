import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, StickyNote, Send } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MessageBubble } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { mapUserMessageToTags } from "@/lib/topicMapping";
import type { Message, Conversation, Specialist } from "@shared/schema";

// Generate or get session ID for user profiling
function getSessionId(): string {
  let sessionId = localStorage.getItem('mate-session-id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('mate-session-id', sessionId);
  }
  return sessionId;
}

export default function Chat() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasNotes, setHasNotes] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [recommendedSpecialist, setRecommendedSpecialist] = useState<Specialist | null>(null);
  const [showSpecialistSwitch, setShowSpecialistSwitch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationId = (id && id !== 'new' && !isNaN(parseInt(id))) ? parseInt(id) : null;
  
  // Check if this is a fresh session (app was closed and reopened)
  useEffect(() => {
    const sessionFlag = sessionStorage.getItem('chat-session-active');
    if (!sessionFlag) {
      // Fresh session - clear any old chat data and show welcome message
      setShowWelcome(true);
      sessionStorage.setItem('chat-session-active', 'true');
      
      // Clear any cached conversation data from React Query
      queryClient.clear();
      
      // Clear any temporary chat state
      localStorage.removeItem('chatDraft');
    }
    
    // Clear session and data when page is unloaded (app closed)
    const handleUnload = () => {
      sessionStorage.removeItem('chat-session-active');
      // Optional: Clear draft messages on close
      localStorage.removeItem('chatDraft');
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);
  
  // If the parsed ID is invalid, redirect to home
  useEffect(() => {
    if (id && id !== 'new' && isNaN(parseInt(id))) {
      setLocation('/');
      return;
    }
  }, [id, setLocation]);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: () => fetch(`/api/conversations/${conversationId}/messages`, { credentials: 'include' }).then(res => res.json()),
    enabled: conversationId !== null
  });

  const { data: conversation, error: conversationError } = useQuery<Conversation>({
    queryKey: ['/api/conversations', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched conversation:', data);
      return data;
    },
    enabled: conversationId !== null && conversationId > 0 // Only fetch for existing conversations
  });

  // Log conversation errors
  useEffect(() => {
    if (conversationError) {
      console.error('Conversation fetch error:', conversationError);
    }
  }, [conversationError]);

  // Load specialist data from specialists list as fallback
  const { data: specialists = [] } = useQuery<Specialist[]>({
    queryKey: ['/api/specialists'],
    queryFn: () => fetch('/api/specialists', { credentials: 'include' }).then(res => res.json())
  });

  const [specialist, setSpecialist] = useState<Specialist | null>(null);

  // Set specialist from conversation data only - no fallback to first specialist
  // Set specialist from conversation data or fallback to first available for /chat/new
  useEffect(() => {
    if (conversation?.specialistId && specialists.length > 0) {
      const foundSpecialist = specialists.find(s => s.id === conversation.specialistId);
      if (foundSpecialist) {
        setSpecialist(foundSpecialist);
        return;
      }
    }
    // Fallback: if on /chat/new and no specialist selected, pick the first available
    if (!conversation && specialists.length > 0 && id === 'new' && !specialist) {
      setSpecialist(specialists[0]);
    }
  }, [conversation, specialists, specialist, id]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Input validation
      if (!content || content.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (content.length > 5000) {
        throw new Error('Message is too long. Please keep it under 5000 characters.');
      }

      let targetConversationId = conversationId;

      // If no conversation exists (e.g., /chat/new), create one first
      if (!targetConversationId && specialist) {
        const createResponse = await apiRequest('POST', '/api/conversations', {
          specialistId: specialist.id,
          title: 'New Conversation'
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create conversation');
        }
        
        const newConversation = await createResponse.json();
        targetConversationId = newConversation.id;
        
        // Update the URL to reflect the new conversation
        setLocation(`/chat/${targetConversationId}`);
      }

      if (!targetConversationId) {
        throw new Error('No conversation available');
      }

      const sessionId = getSessionId();
      const response = await apiRequest('POST', `/api/conversations/${targetConversationId}/messages`, {
        content: content.trim(),
        sessionId
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to send message: ${response.status}`);
      }
      
      return response.json();
    },
    onMutate: async (content: string) => {
      setIsTyping(true);
      
      // Optimistic update - add message to UI immediately
      const previousMessages = queryClient.getQueryData(['/api/conversations', conversationId, 'messages']);
      
      // Create optimistic message with unique ID to prevent duplicates
      const optimisticMessage = {
        id: `optimistic-${Date.now()}-${Math.random()}`, // unique temporary ID
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        conversationId,
        isOptimistic: true // flag to identify optimistic messages
      };
      
      // Update the messages query data
      queryClient.setQueryData(['/api/conversations', conversationId, 'messages'], (old: any) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });
      
      return { previousMessages };
    },
    onSuccess: (data) => {
      setSpecialist(data.specialist);
      
      // Handle specialist recommendations
      if (data.recommendedSpecialist && data.recommendedSpecialist.key !== specialist?.key) {
        setRecommendedSpecialist(data.recommendedSpecialist);
        setShowSpecialistSwitch(true);
        
        // Auto-hide specialist recommendation after 10 seconds
        setTimeout(() => {
          setShowSpecialistSwitch(false);
        }, 10000);
      }
      
      // Log user insights for debugging
      if (data.userInsights) {
        console.log('User insights:', data.userInsights);
      }
      
      // Clear optimistic messages and set real data
      const targetConversationId = conversationId || (data as any)?.conversationId;
      if (targetConversationId) {
        // Remove optimistic messages and add real ones
        queryClient.setQueryData(['/api/conversations', targetConversationId, 'messages'], (old: any) => {
          if (!old) return [data.userMessage, data.assistantMessage];
          
          // Remove optimistic messages and add real ones
          const filteredMessages = old.filter((msg: any) => !msg.isOptimistic);
          return [...filteredMessages, data.userMessage, data.assistantMessage];
        });
      }
      setIsTyping(false);
    },
    onError: (error: any, variables, context) => {
      setIsTyping(false);
      console.error('Failed to send message:', error);
      
      // Get the conversation ID that was actually used
      const targetConversationId = (context as any)?.targetConversationId || conversationId;
      
      if (targetConversationId) {
        // Rollback optimistic update
        if (context?.previousMessages) {
          queryClient.setQueryData(['/api/conversations', targetConversationId, 'messages'], context.previousMessages);
        }
        
        // Add error message to the chat
        const errorMessage = {
          id: Date.now() + 1, // temporary ID
          content: getErrorMessage(error),
          sender: 'system' as const,
          timestamp: new Date().toISOString(),
          conversationId: targetConversationId,
          isError: true
        };
        
        queryClient.setQueryData(['/api/conversations', targetConversationId, 'messages'], (old: any) => {
          return old ? [...old, errorMessage] : [errorMessage];
        });
      }
    }
  });

  // Specialist switch mutation
  const switchSpecialistMutation = useMutation({
    mutationFn: async (specialistId: number) => {
      if (!conversationId) {
        throw new Error('No conversation to switch specialist for');
      }
      
      const response = await apiRequest('PATCH', `/api/conversations/${conversationId}/specialist`, {
        specialistId
      });
      
      if (!response.ok) {
        throw new Error('Failed to switch specialist');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Navigate to the new conversation
      setLocation(`/chat/${data.conversation.id}`);
      setShowSpecialistSwitch(false);
      setRecommendedSpecialist(null);
      
      // Clear current messages and reload
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      console.error('Failed to switch specialist:', error);
    }
  });

  // Helper function to get user-friendly error messages
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    
    if (error?.message) {
      // Handle specific error messages
      if (error.message.includes('timeout') || error.message.includes('408')) {
        return "Response took too long. Please try again.";
      }
      
      if (error.message.includes('too long')) {
        return "Message is too long. Please try breaking it into shorter messages.";
      }
      
      if (error.message.includes('empty')) {
        return "Please enter a message before sending.";
      }
      
      if (error.message.includes('404')) {
        return "Session not found. Please refresh the page.";
      }
      
      if (error.message.includes('5')) { // 500 errors
        return "Server issue. Please try again, or call Lifeline at 13 11 14 if you need immediate support.";
      }
      
      return error.message;
    }
    
    return "Something went wrong. Please try again.";
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sendMessageMutation.isPending) return;

    // Hide welcome message after first interaction
    if (showWelcome) {
      setShowWelcome(false);
    }

    // Map user message to topic tags for AI prompt logic
    const detectedTags = mapUserMessageToTags(trimmedMessage);
    // For now, just log them (replace with prompt logic integration)
    if (detectedTags.length > 0) {
      console.log("Detected topics:", detectedTags);
    }

    // Store the message before clearing (in case of error)
    const messageToSend = trimmedMessage;
    
    sendMessageMutation.mutate(messageToSend, {
      onSuccess: (data) => {
        console.log('Message sent successfully:', data);
        // Only clear the message on successful send
        setMessage("");
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      },
      onError: (error) => {
        console.error("Failed to send message:", error);
        // Keep the message in the input if sending fails
        // Don't clear setMessage so user can retry
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const quickResponses = [
    "Tell me more",
    "What should I do?",
    "That's helpful"
  ];

  const handleQuickResponse = (response: string) => {
    setMessage(response);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Add welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0 && !isLoading && specialist) {
      // Add initial welcome message (this would typically come from the backend)
      const welcomeMessage = `G'day mate! I'm ${specialist.name}, your ${specialist.specialty.toLowerCase()}. What's going on?`;
      
      // We can simulate this or update the backend to automatically create a welcome message
    }
  }, [messages, isLoading, specialist]);

  // Check for draft from notes page
  useEffect(() => {
    const draft = localStorage.getItem("chatDraft");
    if (draft) {
      setMessage(draft);
      localStorage.removeItem("chatDraft"); // Clear after using
      // Focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, []);

  // Check if there are saved notes
  useEffect(() => {
    const savedNotes = localStorage.getItem("mateNotes");
    setHasNotes(!!savedNotes && savedNotes.trim().length > 0);
  }, []);

  // Update notes status when page becomes visible (user returns from notes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const savedNotes = localStorage.getItem("mateNotes");
        setHasNotes(!!savedNotes && savedNotes.trim().length > 0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check private mode status and react to changes immediately
  useEffect(() => {
    const checkPrivateMode = () => {
      const privateModeData = localStorage.getItem('mate-private-mode');
      const isPrivateNow = !!privateModeData;
      
      if (privateMode !== isPrivateNow) {
        if (isPrivateNow) {
          // Private mode just turned on - clear UI immediately for privacy
          queryClient.setQueryData(['/api/conversations', conversationId, 'messages'], []);
          setShowWelcome(true);
        }
        setPrivateMode(isPrivateNow);
      }
    };
    
    checkPrivateMode();
    
    // Listen for private mode changes via storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mate-private-mode') {
        checkPrivateMode();
      }
    };
    
    // Listen for private mode changes via focus events (when user returns to tab)
    const handleFocus = () => {
      checkPrivateMode();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [privateMode, conversationId, queryClient]);

  // Clear chat UI when private mode turns off (but keep data in backend)
  useEffect(() => {
    const checkPrivateModeChange = () => {
      const privateModeData = localStorage.getItem('mate-private-mode');
      const isPrivateNow = !!privateModeData;
      
      if (privateMode !== isPrivateNow) {
        if (!isPrivateNow && privateMode) {
          // Private mode was turned off - clear chat UI
          queryClient.setQueryData(['/api/conversations', conversationId, 'messages'], []);
          setShowWelcome(true);
        } else if (isPrivateNow && !privateMode) {
          // Private mode was turned on - clear chat UI for privacy
          queryClient.setQueryData(['/api/conversations', conversationId, 'messages'], []);
          setShowWelcome(true);
        }
        setPrivateMode(isPrivateNow);
      }
    };
    
    // Run immediately and then on interval
    checkPrivateModeChange();
    const interval = setInterval(checkPrivateModeChange, 200);
    return () => clearInterval(interval);
  }, [privateMode, conversationId, queryClient]);

  // Clear chat UI when leaving app (but retain data in backend)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is being hidden/closed - clear UI after delay
        setTimeout(() => {
          if (document.hidden) {
            queryClient.setQueryData(['/api/conversations', conversationId, 'messages'], []);
            setShowWelcome(true);
          }
        }, 5000); // 5 second delay to allow for quick tab switches
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [conversationId, queryClient]);

  return (
    <div className="min-h-screen modern-bg-blobs flex flex-col items-center justify-start">
      <div className="max-w-md w-full mx-auto glass-card modern-card min-h-screen relative flex flex-col">
        {/* Header */}
  <header className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 dark:from-gray-800 dark:to-gray-900 text-white px-4 py-3 shadow-lg sticky top-0 z-10 rounded-b-3xl glass-card">
    <div className="flex items-center justify-between min-h-[64px] h-16 md:h-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
          className="p-2 modern-btn rounded-full flex items-center justify-center min-h-[40px]"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-semibold leading-tight">
            {specialist?.name || 'Mate'}
          </h1>
          <p className="text-blue-200 dark:text-gray-300 text-sm leading-tight">
            {specialist ? `${specialist.specialty} • Online` : 'AI Assistant • Online'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <PrivacyToggle />
        <button className="p-2 modern-btn rounded-full flex items-center justify-center" title="Profile" onClick={() => setLocation('/profile')}>
          <i className="fas fa-user-circle text-xl"></i>
        </button>
        <button className="p-2 modern-btn rounded-full flex items-center justify-center" title="Settings" onClick={() => setLocation('/settings')}>
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </div>
  </header>

  {/* Messages Area */}
  <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
    {isLoading ? (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-300/60 to-purple-300/60 dark:from-gray-700 dark:to-gray-800 rounded-full"></div>
              <div className="flex-1">
                <div className="glass-card p-4 max-w-xs h-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : !specialist && id === 'new' ? (
      // Show specialist selection prompt when accessing /chat/new without a specialist
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center px-6">
        <div className="text-6xl">🤝</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Choose Your Support Specialist
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To get started, you'll need to select a specialist who can best help with your needs.
          </p>
          <Button 
            onClick={() => setLocation('/specialists')}
            className="modern-btn px-6 py-3 font-semibold"
          >
            Select a Specialist
          </Button>
        </div>
      </div>
    ) : (
      <>
        {/* Welcome message on fresh session or when no messages exist */}
        {(messages.length === 0 || showWelcome) && specialist && (
          <div className="glass-card modern-card p-4">
            <MessageBubble
              content={messages.length === 0 ? 
                `G'day mate! I'm ${specialist.name}. What's going on?` :
                `Welcome back, mate! How are you feeling today?`
              }
              sender="specialist"
              timestamp={new Date()}
              specialistName={specialist?.name}
              specialistSpecialty={specialist?.specialty}
            />
          </div>
        )}
        
        {messages.map((msg) => (
          <div className="glass-card modern-card p-2" key={msg.id}>
            <MessageBubble
              content={msg.content}
              sender={msg.sender as any}
              timestamp={msg.timestamp ? new Date(msg.timestamp) : undefined}
              specialistName={specialist?.name}
              specialistSpecialty={specialist?.specialty}
            />
          </div>
        ))}
        
        {isTyping && <div className="glass-card modern-card p-2"><TypingIndicator /></div>}
      </>
    )}
    <div ref={messagesEndRef} />
  </div>

  {/* Specialist Recommendation Banner */}
  {showSpecialistSwitch && recommendedSpecialist && (
    <div className="fixed top-20 left-0 right-0 max-w-md mx-auto z-30 p-4">
      <div className="glass-card modern-card bg-amber-50/80 dark:bg-amber-900/80 border border-amber-200 dark:border-amber-700 rounded-xl p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <i className={`fas ${recommendedSpecialist.icon} text-white text-xs`}></i>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              Switch to {recommendedSpecialist.name}?
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Based on what you're sharing, {recommendedSpecialist.name} ({recommendedSpecialist.specialty}) might be better suited to help.
            </p>
            <div className="flex space-x-2 mt-3">
              <Button
                size="sm"
                onClick={() => switchSpecialistMutation.mutate(recommendedSpecialist.id)}
                disabled={switchSpecialistMutation.isPending}
                className="modern-btn bg-amber-600 hover:bg-amber-700 text-white"
              >
                {switchSpecialistMutation.isPending ? 'Switching...' : 'Switch Now'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSpecialistSwitch(false)}
                className="modern-btn border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Stay Here
              </Button>
            </div>
          </div>
          <button
            onClick={() => setShowSpecialistSwitch(false)}
            className="modern-btn text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            title="Dismiss recommendation"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Message Input Area - only show when specialist is selected */}
  {specialist && (
    <div className="fixed bottom-16 left-0 right-0 border-t border-gray-200 dark:border-gray-600 p-4 glass-card modern-card bg-white/80 dark:bg-gray-800/80 flex items-end space-x-2 max-w-md mx-auto">
    <button 
      onClick={() => setLocation('/notes')}
      className="modern-btn p-3 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 transition-colors relative" 
      title="Open notepad"
    >
      {hasNotes ? (
        // Filled sticky note with shadow and content indication
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 bg-yellow-400 dark:bg-yellow-500 rounded-sm shadow-sm">
            {/* Folded corner */}
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-300 dark:bg-yellow-400 rounded-sm shadow-sm transform rotate-45 origin-bottom-left"></div>
            {/* Content lines */}
            <div className="absolute top-1 left-0.5 right-1 space-y-0.5">
              <div className="h-0.5 bg-yellow-600 dark:bg-yellow-700 rounded opacity-60"></div>
              <div className="h-0.5 bg-yellow-600 dark:bg-yellow-700 rounded opacity-60 w-3/4"></div>
              <div className="h-0.5 bg-yellow-600 dark:bg-yellow-700 rounded opacity-60 w-1/2"></div>
            </div>
          </div>
        </div>
      ) : (
        // Empty sticky note outline
        <StickyNote className="w-5 h-5 rotate-90" />
      )}
    </button>
    <div className="flex-1 relative">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyPress}
        placeholder="Type your message..."
        className="modern-input w-full pr-12 min-h-[48px]"
        rows={1}
      />
      <button 
        onClick={handleSendMessage}
        disabled={!message.trim() || sendMessageMutation.isPending || !specialist}
        className="modern-btn absolute right-2 bottom-2 p-2 text-primary dark:text-blue-400 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Send message"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  </div>
  )}
  
  {/* Quick Response Suggestions - only show when specialist is selected */}
  {specialist && (
  <div className="flex space-x-2 mt-3 overflow-x-auto">
    {quickResponses.map((response: string, index: number) => (
      <Button
        key={index}
        variant="outline"
        size="sm"
        onClick={() => handleQuickResponse(response)}
        className="modern-btn px-4 py-2 rounded-full text-sm whitespace-nowrap"
      >
        {response}
      </Button>
    ))}
  </div>
  )}

  <BottomNav />
      </div>
    </div>
  );
}
