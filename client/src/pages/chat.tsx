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
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { loadSpecialists, getSpecialistTheme, findSpecialistByKey, findSpecialistById, getFallbackSpecialists } from "@/lib/specialists";
import { syncProfileConversationCount } from "@/lib/profileStorage";
import type { Message, Conversation, Specialist } from "../types";
import { useLocalAI } from "../hooks/useLocalAI";

// Generate or get session ID for user profiling
function getSessionId(): string {
  let sessionId = localStorage.getItem('mate-session-id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('mate-session-id', sessionId);
  }
  return sessionId;
}

const ensureSentence = (text?: string) => {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const pickRandom = <T,>(items?: T[]): T | undefined => {
  if (!items || items.length === 0) return undefined;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

export default function Chat() {
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

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [isSending, setIsSending] = useState(false);


  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    loadSpecialists()
      .then((data) => {
        if (!mounted) return;
        setSpecialists(data);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        console.warn('Falling back to bundled specialist data');
        setSpecialists(getFallbackSpecialists());
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);


  const {
    isInitialized: isLocalAIInitialized,
    isLoading: isLocalAILoading,
    error: localAIError,
    hasNativeRuntime,
    sendMessage: sendLocalAIMessage,
    initializeAI: initializeLocalAI
  } = useLocalAI();
  const [localAIStatusMessage, setLocalAIStatusMessage] = useState<string | null>(null);

  // Load messages from localStorage on component mount
  useEffect(() => {
    if (conversationId) {
      const savedMessages = localStorage.getItem(`conversation_${conversationId}_messages`);
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          const hydrated: Message[] = Array.isArray(parsed)
            ? parsed.map((msg: any) => ({
                ...msg,
                timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
              }))
            : [];
          setMessages(hydrated);
        } catch (error) {
          console.error('Error parsing saved messages:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      const savedConversation = localStorage.getItem(`conversation_${conversationId}`);
      if (savedConversation) {
        try {
          const parsed = JSON.parse(savedConversation);
          setConversation(parsed);
        } catch (error) {
          console.error('Error parsing saved conversation:', error);
        }
      }
    } else {
      setConversation(null);
    }
  }, [conversationId]);

  useEffect(() => {
    if (specialists.length === 0) return;

    if (conversation?.specialistId) {
      const found = findSpecialistById(specialists, conversation.specialistId);
      if (found) {
        setSpecialist(found);
        return;
      }
    }

    if (conversation?.specialistKey) {
      const foundByKey = findSpecialistByKey(specialists, conversation.specialistKey);
      if (foundByKey) {
        setSpecialist(foundByKey);
        return;
      }
    }

    if (!specialist) {
      const savedSpecialist = localStorage.getItem('selectedSpecialist');
      if (savedSpecialist) {
        try {
          const parsed = JSON.parse(savedSpecialist);
          const resolved = findSpecialistByKey(specialists, parsed?.key) || findSpecialistById(specialists, parsed?.id);
          if (resolved) {
            setSpecialist(resolved);
          }
        } catch (error) {
          console.error('Error parsing saved specialist:', error);
        } finally {
          localStorage.removeItem('selectedSpecialist');
        }
        if (specialist) return;
      }
    }

    if (!specialist && id === 'new') {
      const urlParams = new URLSearchParams(window.location.search);
      const specialistKey = urlParams.get('specialist');
      if (specialistKey) {
        const foundSpecialist = findSpecialistByKey(specialists, specialistKey);
        if (foundSpecialist) {
          setSpecialist(foundSpecialist);
          return;
        }
      }
    }

    if (!conversation && specialists.length > 0 && id === 'new' && !specialist) {
      const fallbackSpecialist = findSpecialistByKey(specialists, 'mens_mental_health') || specialists[0];
      setSpecialist(fallbackSpecialist);
    }
  }, [conversation, specialists, specialist, id]);

  useEffect(() => {

    if (specialist && messages.length === 0) {
      setShowWelcome(true);
    } else {
      setShowWelcome(false);
    }
  }, [specialist, messages.length]);

  const specialistTheme = useMemo(() => getSpecialistTheme(specialist), [specialist]);
  const specialistIcon = specialist?.icon ?? 'fas fa-comment';
  const specialistTagline = specialist?.knowledgeBase?.persona;

  const generateAIResponse = (userMessage: string, activeSpecialist: Specialist, detectedTags: string[]): string => {
    if (!hasNativeRuntime) {
      setLocalAIStatusMessage('Local AI is available on native builds. Using fallback responses in the web preview.');
      return;
    }

    if (localAIError) {
      setLocalAIStatusMessage(`${localAIError} Fallback responses will be used.`);
      return;
    }

    if (!isLocalAIInitialized) {
      setLocalAIStatusMessage(isLocalAILoading ? 'Loading on-device AI model...' : 'Local AI is not initialized yet. Fallback responses will be used.');
      return;
    }

    setLocalAIStatusMessage(null);
  }, [hasNativeRuntime, localAIError, isLocalAIInitialized, isLocalAILoading]);

  const canUseLocalAI = hasNativeRuntime && isLocalAIInitialized && !localAIError;
  const showTypingIndicator = isTyping || isLocalAILoading;

  // Generate AI response based on user input and specialist
  const generateFallbackResponse = (userMessage: string, specialist: Specialist): string => {
    const lowerMessage = userMessage.toLowerCase();
    const name = username ? `, ${username}` : '';

    if (lowerMessage.includes('suicide') || lowerMessage.includes('kill myself') || lowerMessage.includes('end it all')) {
      return "Mate, I'm really concerned about you right now. Your life has value, and there are people who want to help. Please reach out to Lifeline at 13 11 14 immediately. They're available 24/7. Can you promise me you'll stay safe while we talk?";
    }

    if (lowerMessage.includes('hurt myself') || lowerMessage.includes('self harm')) {
      return "I'm worried about you, mate. Those feelings of wanting to hurt yourself are a sign that you're in real pain. Let's work through this together. Have you felt this way before? What usually helps you feel safer?";
    }

    const knowledge = activeSpecialist.knowledgeBase ?? {};
    const opener = pickRandom(knowledge.conversationStarters) ?? `Thanks for sharing that${name}. What feels most important right now?`;
    const technique = pickRandom(knowledge.techniques);
    const support = pickRandom(knowledge.supportPhrases) ?? "You're not alone in this—we'll navigate it together.";
    const relevantFocus = knowledge.focusAreas?.find((focus) =>
      detectedTags.some((tag) => focus.toLowerCase().includes(tag.toLowerCase()))
    );

    const techniqueSentence = technique ? ensureSentence(`One approach we can explore is ${technique}`) : '';
    const focusSentence = relevantFocus
      ? ensureSentence(`We'll keep your goal of ${relevantFocus.toLowerCase()} front of mind as we continue`)
      : '';
    const trimmedSupport = support.trim();
    const supportWithCompanion = username
      ? `${trimmedSupport}${/[.!?]$/.test(trimmedSupport) ? '' : '.'} ${username}, I'm right here with you.`
      : trimmedSupport;
    const supportSentence = ensureSentence(supportWithCompanion);

    return [opener, focusSentence, techniqueSentence, supportSentence].filter(Boolean).join(' ');
  };


  const sendMessage = async (content: string, detectedTags: string[]) => {

  const getFallbackResponse = async (userMessage: string, specialist: Specialist): Promise<string> => {
    return await new Promise((resolve) => {
      const delay = 1000 + Math.random() * 2000;
      setTimeout(() => resolve(generateFallbackResponse(userMessage, specialist)), delay);
    });
  };

  // Send message using localStorage instead of API for offline functionality
  const sendMessage = async (content: string) => {
    if (!content || content.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (content.length > 5000) {
      throw new Error('Message is too long. Please keep it under 5000 characters.');
    }

    const activeSpecialist = specialist || specialists[0];
    if (!activeSpecialist) {
      throw new Error('No specialist selected');
    }

    setIsSending(true);
    try {
      let targetConversationId = conversationId;


      if (!targetConversationId && specialist) {
        const now = new Date().toISOString();
      if (!targetConversationId) {

        const newConversationId = Date.now();
        const newConversation: Conversation = {
          id: newConversationId,

          specialistId: specialist.id,
          specialistKey: specialist.key,
          title: `${specialist.specialty} Support`,
          createdAt: now,
          updatedAt: now,
        };

        localStorage.setItem(`conversation_${newConversationId}`, JSON.stringify(newConversation));

          specialistId: activeSpecialist.id,
          title: 'New Conversation',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        localStorage.setItem(`conversation_${newConversationId}`, JSON.stringify(newConversation));
        syncProfileConversationCount();
        setConversation(newConversation);
        targetConversationId = newConversationId;
        setLocation(`/chat/${newConversationId}`);
      }

      const userMessage: Message = {
        id: Date.now(),
        content: content.trim(),
        sender: 'user',
        timestamp: new Date(),
        conversationId: targetConversationId!,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      localStorage.setItem(`conversation_${targetConversationId}_messages`, JSON.stringify(updatedMessages));

      const conversationKey = `conversation_${targetConversationId}`;
      const savedConversation = localStorage.getItem(conversationKey);
      if (savedConversation) {
        try {
          const parsed = JSON.parse(savedConversation);
          parsed.updatedAt = new Date().toISOString();
          if (specialist) {
            parsed.specialistId = specialist.id;
            parsed.specialistKey = specialist.key;
          }
          localStorage.setItem(conversationKey, JSON.stringify(parsed));
          setConversation(parsed);
        } catch (error) {
          console.error('Failed to update conversation metadata:', error);
        }
      }

      setIsTyping(true);

      setTimeout(() => {
        const aiResponse: Message = {
          id: Date.now() + 1,
          content: generateAIResponse(content.trim(), specialist!, detectedTags),
          sender: 'specialist',
          timestamp: new Date(),
          conversationId: targetConversationId!,
        };

        const finalMessages = [...updatedMessages, aiResponse];
        setMessages(finalMessages);
        localStorage.setItem(`conversation_${targetConversationId}_messages`, JSON.stringify(finalMessages));
        setIsTyping(false);
      }, 1000 + Math.random() * 2000);
      setIsTyping(true);

      let aiResponseContent: string;
      if (canUseLocalAI) {
        try {
          aiResponseContent = await sendLocalAIMessage(content.trim());
        } catch (localError) {
          console.error('Local AI send error:', localError);
          const fallbackMessage = localError instanceof Error ? localError.message : 'Local AI failed to respond';
          setLocalAIStatusMessage(`${fallbackMessage}. Using fallback responses.`);
          aiResponseContent = await getFallbackResponse(content.trim(), activeSpecialist);
        }
      } else {
        if (hasNativeRuntime && localAIError) {
          setLocalAIStatusMessage(`${localAIError} Fallback responses will be used.`);
        }
        aiResponseContent = await getFallbackResponse(content.trim(), activeSpecialist);
      }

      const aiResponse: Message = {
        id: Date.now() + 1,
        content: aiResponseContent,
        sender: 'specialist',
        timestamp: new Date(),
        conversationId: targetConversationId!
      };

      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      localStorage.setItem(`conversation_${targetConversationId}_messages`, JSON.stringify(finalMessages));
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;

    if (error?.message) {
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

    const detectedTags = mapUserMessageToTags(trimmedMessage);
    if (detectedTags.length > 0) {
      console.log("Detected topics:", detectedTags);
    }

    try {
      await sendMessage(trimmedMessage, detectedTags);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to send message:", error);
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
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isLocalAILoading]);

  useEffect(() => {
    const savedNotes = localStorage.getItem("mateNotes");
    setHasNotes(!!savedNotes && savedNotes.trim().length > 0);
  }, []);

  useEffect(() => {
    const chatDraft = localStorage.getItem("chatDraft");
    if (chatDraft) {
      setMessage(chatDraft);
      localStorage.removeItem("chatDraft");
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current!.style.height = 'auto';
          textareaRef.current!.style.height = Math.min(textareaRef.current!.scrollHeight, 120) + 'px';
        }, 0);
      }
    }
  }, []);

  const buildWelcomeMessage = (type: 'first' | 'return') => {
    if (!specialist) return '';
    const displayName = specialist.name.replace(/\s*\([^)]*\)/g, '');
    const personaLine = specialist.knowledgeBase?.persona
      ? ensureSentence(`I'm ${displayName}, ${specialist.knowledgeBase.persona}`)
      : ensureSentence(`I'm ${displayName}, your ${specialist.specialty} specialist`);
    const opener = type === 'first'
      ? specialist.knowledgeBase?.conversationStarters?.[0] ?? "What's on your mind today?"
      : specialist.knowledgeBase?.supportPhrases?.[0] ?? "How are you feeling today?";
    return [`G'day${username ? `, ${username}` : ''}!`, personaLine, opener].filter(Boolean).join(' ');
  };

  const placeholderAccent = specialistTheme.accent?.startsWith('text-')
    ? specialistTheme.accent.replace('text-', 'placeholder:text-')
    : 'placeholder:text-gray-400';

  return (
    <div className="min-h-screen flex flex-col items-center justify-start relative">
      <div className="modern-bg-blobs"></div>

      <div className="max-w-md w-full mx-auto glass-card shadow-2xl min-h-screen relative flex flex-col pb-20 z-10">
        <header className={`bg-gradient-to-r ${specialistTheme.gradient} text-white px-4 py-3 pt-safe shadow-lg sticky top-0 z-10 rounded-t-3xl glass-card`}>
          <div className="flex items-center justify-between min-h-[64px] h-16 md:h-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/')}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              {specialist ? (
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${specialistTheme.avatarBg} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <i className={`${specialistIcon} ${specialistTheme.avatarText} text-xl`}></i>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-lg font-semibold leading-tight line-clamp-1">{specialist.name}</h1>
                    <span className={`text-sm ${specialistTheme.accent} opacity-90`}>{specialist.specialty}</span>
                    {specialistTagline && (
                      <span className={`text-xs ${specialistTheme.accent} opacity-80 line-clamp-2`}>{specialistTagline}</span>
                    )}
                  </div>
                </div>
              ) : (
                <h1 className="text-xl font-semibold leading-tight">Mate</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PrivacyToggle />
              <ProfileIconWithName onClick={() => setLocation('/profile')} />
              <button
                className="p-3 hover:bg-white/20 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Settings"
                onClick={() => setLocation('/settings')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-blue-100">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.01 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.572-1.01c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.572c-.94-1.543.826-3.31 2.37-2.37.996.608 2.265.07 2.572-1.01z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {localAIStatusMessage && (
          <div className="px-4 pt-3">
            <div className="glass-card border border-yellow-300/70 dark:border-yellow-700/70 bg-yellow-50/80 dark:bg-yellow-900/40 text-sm text-yellow-900 dark:text-yellow-100 rounded-2xl px-3 py-2 flex items-start justify-between gap-2">
              <span>{localAIStatusMessage}</span>
              {hasNativeRuntime && localAIError && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => initializeLocalAI()}
                  className="text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200/60 dark:hover:bg-yellow-800/60"
                  disabled={isLocalAILoading}
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className={`w-8 h-8 ${specialistTheme.avatarBg} rounded-full`}></div>
                    <div className="flex-1">
                      <div className="glass-card p-4 max-w-xs h-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !specialist && id === 'new' ? (
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
              {(messages.length === 0 && showWelcome) && specialist && (
                <div className="glass-card modern-card p-4">
                  <MessageBubble
                    content={buildWelcomeMessage('first')}
                    sender="specialist"
                    timestamp={new Date()}
                    specialistName={specialist.name}
                    specialistSpecialty={specialist.specialty}
                    specialistIcon={specialistIcon}
                    theme={specialistTheme}
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
                    specialistIcon={specialistIcon}
                    theme={specialistTheme}
                  />
                </div>
              ))}

              {isTyping && (
                <div className="glass-card modern-card p-2">
                  <TypingIndicator theme={specialistTheme} icon={specialistIcon} />
                </div>
              )}
              
              {showTypingIndicator && <div className="glass-card modern-card p-2"><TypingIndicator /></div>}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {specialist && (
          <footer className="fixed bottom-16 left-0 w-full max-w-md mx-auto px-2 z-40">
            <div className="glass-card modern-card flex gap-2 p-4 rounded-2xl shadow-xl border border-white/20 backdrop-blur-md items-center">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className={`flex-1 modern-input glass-card font-mono resize-none min-h-[48px] max-h-32 border-white/20 bg-transparent text-white ${placeholderAccent}`}
                style={{ marginBottom: 0 }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
                className="flex items-center justify-center ml-2 focus:outline-none disabled:opacity-50 bg-transparent border-0 p-0"
                title="Send"
                type="button"
                style={{ alignSelf: 'center' }}
              >
                <Send className={`${specialistTheme.accent} hover:opacity-90 transition-colors -rotate-45`} />
              </button>
            </div>
          </footer>
        )}

        <BottomNav />
      </div>
    </div>
  );
}
