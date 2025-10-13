// Prompt for username on first launch
function getOrPromptUsername(): string {
  let username = localStorage.getItem('username');
  if (!username) {
    username = window.prompt('Welcome! What is your first name?') || '';
    if (username) {
      localStorage.setItem('username', username);
    }
  }
  return username || '';
}
import "../styles/chat.css";
import React, { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Send } from "lucide-react";
import { ProfileIconWithName } from "@/components/ProfileIconWithName";
import { useLocation, useParams } from "wouter";
import { MessageBubble } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { mapUserMessageToTags } from "@/lib/topicMapping";
import type { Message, Conversation, Specialist } from "../types";
import { CrisisDetectionService } from "@/lib/crisisDetection";

// Generate or get session ID for user profiling
function getSessionId(): string {
  let sessionId = localStorage.getItem('mate-session-id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('mate-session-id', sessionId);
  }
  return sessionId;
}

function getEmergencyUserId(): number {
  try {
    const stored = localStorage.getItem('emergencyUserId');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    const fallback = 1;
    localStorage.setItem('emergencyUserId', fallback.toString());
    return fallback;
  } catch {
    return 1;
  }
}

export default function Chat() {
  // Personalization: get username
  const username = getOrPromptUsername();
  const { id } = useParams<{ id: string }>();
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
  
  // Load specialist data from local hardcoded list (offline mode)
  const hardcodedSpecialists: Specialist[] = [
    { id: 1, key: "psychology", name: "Dr. Greg (General Psychology)", specialty: "Mental Health Support", description: "General mental health support and counseling", icon: "fas fa-brain", color: "blue" },
    { id: 2, key: "stress", name: "Dr. Maya (Stress Management)", specialty: "Stress & Anxiety", description: "Help with stress, anxiety, and coping strategies", icon: "fas fa-spa", color: "green" },
    { id: 3, key: "relationship", name: "Dr. Alex (Relationship Counseling)", specialty: "Relationships", description: "Support for relationship issues and communication", icon: "fas fa-heart", color: "pink" },
    { id: 4, key: "grief_counseling", name: "Dr. Sam (Grief Counseling)", specialty: "Loss & Grief", description: "Support through grief, loss, and bereavement", icon: "fas fa-dove", color: "purple" },
    { id: 5, key: "addiction", name: "Dr. Riley (Addiction Support)", specialty: "Addiction Recovery", description: "Support for addiction recovery and substance abuse", icon: "fas fa-shield-alt", color: "orange" },
    { id: 6, key: "trauma_therapy", name: "Dr. Jordan (Trauma Therapy)", specialty: "Trauma & PTSD", description: "Specialized support for trauma and PTSD", icon: "fas fa-hands-helping", color: "red" },
    { id: 7, key: "career", name: "Dr. Casey (Career Counseling)", specialty: "Career & Work", description: "Guidance for career decisions and workplace issues", icon: "fas fa-briefcase", color: "teal" },
    { id: 8, key: "sleep_psychology", name: "Dr. Taylor (Sleep Psychology)", specialty: "Sleep & Rest", description: "Help with sleep disorders and healthy sleep habits", icon: "fas fa-moon", color: "indigo" },
    { id: 9, key: "mens_mental_health", name: "Dr. Ben (Men's Mental Health)", specialty: "Men's Issues", description: "Support for men's mental health and well-being", icon: "fas fa-male", color: "cyan" },
    { id: 10, key: "empathy_specialist", name: "Dr. Marcus (Empathy Development)", specialty: "Empathy Development Expert", description: "Empathic skills, compassionate communication, perspective-taking", icon: "fas fa-hand-holding-heart", color: "indigo" },
  ];

  // Use hardcoded specialists instead of API call for offline functionality
  const specialists = hardcodedSpecialists;

  // Load messages from localStorage instead of API for offline functionality
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [isSending, setIsSending] = useState(false);
  const emergencyUserIdRef = useRef<number>(getEmergencyUserId());

  // Load messages from localStorage on component mount
  useEffect(() => {
    if (conversationId) {
      const savedMessages = localStorage.getItem(`conversation_${conversationId}_messages`);
      if (savedMessages) {
        try {
          setMessages(JSON.parse(savedMessages));
        } catch (error) {
          console.error('Error parsing saved messages:', error);
          setMessages([]);
        }
      }
    }
  }, [conversationId]);

  // Load conversation from localStorage
  useEffect(() => {
    if (conversationId) {
      const savedConversation = localStorage.getItem(`conversation_${conversationId}`);
      if (savedConversation) {
        try {
          setConversation(JSON.parse(savedConversation));
        } catch (error) {
          console.error('Error parsing saved conversation:', error);
        }
      }
    }
  }, [conversationId]);

  // Set specialist from conversation data or fallback
  useEffect(() => {
    if (conversation?.specialistId && specialists.length > 0) {
      const foundSpecialist = specialists.find(s => s.id === conversation.specialistId);
      if (foundSpecialist) {
        setSpecialist(foundSpecialist);
        return;
      }
    }

    // Check for specialist from localStorage (selected from specialists page)
    const savedSpecialist = localStorage.getItem('selectedSpecialist');
    if (savedSpecialist && !specialist) {
      try {
        const parsedSpecialist = JSON.parse(savedSpecialist);
        setSpecialist(parsedSpecialist);
        localStorage.removeItem('selectedSpecialist'); // Clear after using
        return;
      } catch (error) {
        console.error('Error parsing saved specialist:', error);
      }
    }

    // Check URL parameters for specialist key
    if (id === 'new' && !specialist) {
      const urlParams = new URLSearchParams(window.location.search);
      const specialistKey = urlParams.get('specialist');
      if (specialistKey) {
        const foundSpecialist = specialists.find(s => s.key === specialistKey);
        if (foundSpecialist) {
          setSpecialist(foundSpecialist);
          return;
        }
      }
    }

    // Fallback: if on /chat/new and no specialist selected, pick 'Men's Mental Health'
    if (!conversation && specialists.length > 0 && id === 'new' && !specialist) {
      const mensMentalHealthSpecialist = specialists.find(s => s.key === 'mens_mental_health');
      setSpecialist(mensMentalHealthSpecialist || specialists[0]);
    }
  }, [conversation, specialists, specialist, id]);

  // Generate AI response based on user input and specialist
  const generateAIResponse = (userMessage: string, specialist: Specialist): string => {
    const lowerMessage = userMessage.toLowerCase();
    // Personalize with username if available
    const name = localStorage.getItem('username') || '';

    // Crisis detection responses
    if (lowerMessage.includes('suicide') || lowerMessage.includes('kill myself') || lowerMessage.includes('end it all')) {
      return "Mate, I'm really concerned about you right now. Your life has value, and there are people who want to help. Please reach out to Lifeline at 13 11 14 immediately. They're available 24/7. Can you promise me you'll stay safe while we talk?";
    }

    if (lowerMessage.includes('hurt myself') || lowerMessage.includes('self harm')) {
      return "I'm worried about you, mate. Those feelings of wanting to hurt yourself are a sign that you're in real pain. Let's work through this together. Have you felt this way before? What usually helps you feel safer?";
    }

    // Specialist-specific responses
    const responses = {
      psychology: [
        `That sounds really challenging${name ? ", " + name : ", mate"}. Can you tell me more about how this is affecting your daily life?`,
        `I hear you${name ? ", " + name : ", mate"}. It's completely normal to feel overwhelmed sometimes. What's been the hardest part for you?`,
        `Thanks for sharing that${name ? ", " + name : ", mate"}. It takes courage to open up. How long have you been feeling this way?`,
        `You're not alone in this${name ? ", " + name : ", mate"}. What's been on your mind lately?`,
        `I get it${name ? ", " + name : ", mate"}. Life can be tough sometimes. What's been weighing you down?`,
      ],
      stress: [
        `Stress can be a real bugger${name ? ", " + name : ", mate"}. What's been causing it for you?`,
        `${name ? name : 'Mate'}, let's take a deep breath together. What's been stressing you out?`,
        `I hear you${name ? ", " + name : ", mate"}. Stress can be overwhelming. What's been the biggest challenge for you?`,
        `You're doing your best${name ? ", " + name : ", mate"}. What's been on your plate lately?`,
        `Stress can be tough to manage${name ? ", " + name : ", mate"}. What's been helping you cope so far?`,
      ],
      relationship: [
        `Relationships can be tricky${name ? ", " + name : ", mate"}. What's been going on?`,
        `${name ? name : 'Mate'}, communication is key. What's been the hardest part for you?`,
        `I hear you${name ? ", " + name : ", mate"}. Relationships take work. What's been on your mind?`,
        `You're not alone in this${name ? ", " + name : ", mate"}. What's been happening in your relationship?`,
        `Relationships can be a rollercoaster${name ? ", " + name : ", mate"}. What's been the biggest challenge for you?`,
      ],
      // Add more specialist-specific responses here...
    };

    const specialistResponses = responses[specialist.key] || ["I'm here to help, mate. Tell me more about what's going on."];
    return specialistResponses[Math.floor(Math.random() * specialistResponses.length)];
  };

  // Send message using localStorage instead of API for offline functionality
  const sendMessage = async (content: string) => {
    // Input validation
    if (!content || content.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (content.length > 5000) {
      throw new Error('Message is too long. Please keep it under 5000 characters.');
    }

    setIsSending(true);
    try {
      let targetConversationId = conversationId;

      // If no conversation exists (e.g., /chat/new), create one first
      if (!targetConversationId && specialist) {
        // Create new conversation ID
        const newConversationId = Date.now();
        const newConversation = {
          id: newConversationId,
          specialistId: specialist.id,
          title: 'New Conversation',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save conversation to localStorage
        localStorage.setItem(`conversation_${newConversationId}`, JSON.stringify(newConversation));
        
        // Update current conversation
        setConversation(newConversation);
        targetConversationId = newConversationId;
        
        // Update URL to reflect new conversation
        setLocation(`/chat/${newConversationId}`);
      }

      // Create user message
      const userMessage: Message = {
        id: Date.now(),
        content: content.trim(),
        sender: 'user',
        timestamp: new Date(),
        conversationId: targetConversationId!
      };

      // Add user message to messages
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Save messages to localStorage
      localStorage.setItem(`conversation_${targetConversationId}_messages`, JSON.stringify(updatedMessages));

      // Show typing indicator
      setIsTyping(true);

      // Simulate AI response after a delay
      setTimeout(() => {
        const aiResponse: Message = {
          id: Date.now() + 1,
          content: generateAIResponse(content.trim(), specialist!),
          sender: 'specialist',
          timestamp: new Date(),
          conversationId: targetConversationId!
        };

        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);
        localStorage.setItem(`conversation_${targetConversationId}_messages`, JSON.stringify(finalMessages));
        setIsTyping(false);
      }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

    } catch (error) {
      setIsTyping(false);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

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
      
      return error.message;
    }
    
    return "Something went wrong. Please try again.";
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

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

    try {
      const riskLevel = CrisisDetectionService.assessRiskLevel(trimmedMessage);
      if (riskLevel === "high" || riskLevel === "critical") {
        CrisisDetectionService.triggerEmergencyResponse(
          riskLevel,
          trimmedMessage,
          emergencyUserIdRef.current || 1
        ).catch((error) => {
          console.error('Emergency response workflow failed:', error);
        });
      }

      await sendMessage(trimmedMessage);
      // Only clear the message on successful send
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Keep the message in the input if sending fails
      // Show error to user
      alert(getErrorMessage(error));
    }
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Check if there are saved notes
  useEffect(() => {
    const savedNotes = localStorage.getItem("mateNotes");
    setHasNotes(!!savedNotes && savedNotes.trim().length > 0);
  }, []);

  // Check for draft notes on component mount
  useEffect(() => {
    const chatDraft = localStorage.getItem("chatDraft");
    if (chatDraft) {
      setMessage(chatDraft);
      localStorage.removeItem("chatDraft"); // Clear after using
      
      // Auto-resize textarea for the loaded content
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current!.style.height = 'auto';
          textareaRef.current!.style.height = Math.min(textareaRef.current!.scrollHeight, 120) + 'px';
        }, 0);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative">
      {/* Animated background */}
      <div className="modern-bg-blobs"></div>
      
      <div className="max-w-md w-full mx-auto glass-card shadow-2xl min-h-screen relative flex flex-col pb-20 z-10">
        {/* Header */}
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
              <h1 className="text-xl font-semibold leading-tight">Mate</h1>
            </div>
            <div className="flex items-center gap-2">
              <PrivacyToggle />
              <ProfileIconWithName onClick={() => setLocation('/profile')} />
              <button
                className="p-3 hover:bg-blue-600 dark:hover:bg-blue-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center interactive cursor-pointer"
                title="Settings"
                onClick={() => setLocation('/settings')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-blue-200 dark:text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.01 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.572-1.01c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.572c-.94-1.543.826-3.31 2.37-2.37.996.608 2.265.07 2.572-1.01z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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
                      `G'day${username ? `, ${username}` : ''}! I'm ${specialist.name}. What's going on?` :
                      `Welcome back${username ? `, ${username}` : ''}! How are you feeling today?`
                    }
                    sender="specialist"
                    timestamp={new Date()}
                    specialistName={specialist.name}
                    specialistSpecialty={specialist.specialty}
                  />
                </div>
              )}
              
              {messages.map((msg) => (
                <div className="glass-card modern-card p-2" key={msg.id}>
                  <MessageBubble
                    content={msg.content}
                    sender={msg.sender as any}
                    timestamp={msg.timestamp}
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

        {/* Message Input Area - only show when specialist is selected */}
        {specialist && (
          <footer className="fixed bottom-16 left-0 w-full max-w-md mx-auto px-2 z-40">
            <div className="glass-card modern-card flex gap-2 p-4 rounded-2xl shadow-xl border border-white/20 backdrop-blur-md items-center">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 modern-input glass-card font-mono resize-none min-h-[48px] max-h-32 border-white/20 bg-transparent text-white"
                style={{marginBottom: 0}}
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="flex items-center justify-center ml-2 focus:outline-none disabled:opacity-50 bg-transparent border-0 p-0"
                title="Send"
                type="button"
                style={{ alignSelf: 'center' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" className="w-7 h-7 text-blue-300 hover:text-blue-500 transition-colors -rotate-45">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z" />
                </svg>
              </button>
            </div>
          </footer>
        )}

        <BottomNav />
      </div>
    </div>
  );
}
