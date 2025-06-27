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
import { useLocalAI } from "@/hooks/useLocalAI";
import { buildMatePrompt, getUserStyleSummary } from "@/lib/matePrompt";
import { saveUserContext, getUserContext } from "@/lib/userContext";
import type { Message, Conversation, Specialist } from "../types";

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

  // Initialize AI integration
  const { isInitialized: aiInitialized, isLoading: aiLoading, error: aiError, sendMessage: sendAIMessage, initializeAI } = useLocalAI();

  const conversationId = (id && id !== 'new' && !isNaN(parseInt(id))) ? parseInt(id) : null;
  
  // Load specialist data from JSON file (offline mode)
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  // Load messages from localStorage instead of API for offline functionality
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [isSending, setIsSending] = useState(false);

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

  // Enhanced AI response generation using local model and sophisticated prompts
  const generateAIResponse = async (userMessage: string, specialist: Specialist): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    // Personalize with username if available
    const name = localStorage.getItem('username') || '';
    const userId = getSessionId(); // Use session ID as user ID

    // Crisis detection responses (immediate, don't use AI for these)
    if (lowerMessage.includes('suicide') || lowerMessage.includes('kill myself') || lowerMessage.includes('end it all')) {
      return "Mate, I'm really concerned about you right now. Your life has value, and there are people who want to help. Please reach out to Lifeline at 13 11 14 immediately. They're available 24/7. Can you promise me you'll stay safe while we talk?";
    }

    if (lowerMessage.includes('hurt myself') || lowerMessage.includes('self harm')) {
      return "I'm worried about you, mate. Those feelings of wanting to hurt yourself are a sign that you're in real pain. Let's work through this together. Have you felt this way before? What usually helps you feel safer?";
    }

    // Get recent messages for context (last 5 user messages)
    const recentMessages = messages
      .filter(msg => msg.sender === 'user')
      .slice(-5)
      .map(msg => msg.content);

    // Always try to use local AI first (this is an offline app)
    try {
      // Build sophisticated prompt with context and style mirroring
      const prompt = await buildMatePrompt({
        userId,
        recentMessages,
        userMessage
      });

      // Add specialist-specific context
      const specialistContext = `You are ${specialist.name}, specializing in ${specialist.specialty}. ${specialist.description}`;
      const fullPrompt = `${specialistContext}\n\n${prompt}`;

      // Try local AI model (works on mobile/native platforms)
      if (aiInitialized && !aiError) {
        try {
          const aiResponse = await sendAIMessage(fullPrompt);
          
          // Update user context based on the conversation
          await updateUserContext(userId, userMessage);
          
          return aiResponse;
        } catch (error) {
          console.error('Local AI model failed:', error);
        }
      }

      // For development/testing: Use sophisticated template system with full prompt logic
      // This maintains the same quality as AI responses but uses templates
      const sophisticatedResponse = await generateSophisticatedResponse(
        fullPrompt, 
        specialist, 
        name, 
        recentMessages,
        userId
      );
      
      // Update user context even when using templates
      await updateUserContext(userId, userMessage);
      
      return sophisticatedResponse;

    } catch (error) {
      console.error('AI response generation failed:', error);
      
      // Emergency fallback only
      return `Sorry mate, I'm having a technical issue right now. ${specialist.name} here - can you tell me a bit more about what's going on and I'll do my best to help?`;
    }
  };

  // Sophisticated response generation using prompt logic with template responses
  const generateSophisticatedResponse = async (
    fullPrompt: string, 
    specialist: Specialist, 
    name: string, 
    recentMessages: string[], 
    userId: string
  ): Promise<string> => {
    // Analyze user's communication style from prompt
    const userStyle = getUserStyleSummary(recentMessages);
    const usesSlang = userStyle.includes('slang');
    const isInformal = userStyle.includes('swears') || userStyle.includes('casual');
    const hasHumor = userStyle.includes('humor');

    // Get user context for personalization
    const userContext = await getUserContext(userId);
    
    // Extract key topics from the user message
    const userMessage = recentMessages[recentMessages.length - 1] || '';
    const topics = extractTopics(userMessage.toLowerCase());
    
    // Generate contextually appropriate response based on specialist and topics
    let response = generateSpecialistResponse(specialist, topics, name, isInformal, usesSlang, hasHumor);
    
    // Add context memory if available
    if (userContext) {
      response = addContextualMemory(response, userContext, name);
    }
    
    return response;
  };

  // Extract topics from user message
  const extractTopics = (message: string): string[] => {
    const topics = [];
    
    if (message.includes('work') || message.includes('job') || message.includes('boss') || message.includes('career')) {
      topics.push('work');
    }
    if (message.includes('relationship') || message.includes('partner') || message.includes('dating') || message.includes('marriage')) {
      topics.push('relationship');
    }
    if (message.includes('stress') || message.includes('anxiety') || message.includes('overwhelmed') || message.includes('pressure')) {
      topics.push('stress');
    }
    if (message.includes('sleep') || message.includes('tired') || message.includes('insomnia') || message.includes('exhausted')) {
      topics.push('sleep');
    }
    if (message.includes('family') || message.includes('parents') || message.includes('kids') || message.includes('children')) {
      topics.push('family');
    }
    if (message.includes('depression') || message.includes('sad') || message.includes('down') || message.includes('hopeless')) {
      topics.push('depression');
    }
    if (message.includes('anger') || message.includes('angry') || message.includes('furious') || message.includes('mad')) {
      topics.push('anger');
    }
    
    return topics;
  };

  // Generate specialist-specific response based on topics
  const generateSpecialistResponse = (
    specialist: Specialist, 
    topics: string[], 
    name: string, 
    isInformal: boolean, 
    usesSlang: boolean, 
    hasHumor: boolean
  ): string => {
    const casualGreeting = isInformal ? "Bloody hell" : "I hear you";
    const slangPhrase = usesSlang ? "Fair dinkum" : "That's tough";
    const nameRef = name ? `, ${name}` : ", mate";
    
    // Topic-specific responses by specialist
    if (topics.includes('work') && specialist.key === 'career') {
      return `${casualGreeting}${nameRef}, work stress is a real killer. ${isInformal ? "Boss being a dick again?" : "What's happening at work?"} Let's figure out how to handle this workplace drama.`;
    }
    
    if (topics.includes('relationship') && specialist.key === 'relationship') {
      return `${slangPhrase}${nameRef}, relationships can be a real headache. ${isInformal ? "Is your partner being a pain in the arse?" : "What's going on between you two?"} Communication is everything in relationships.`;
    }
    
    if (topics.includes('stress') && specialist.key === 'stress') {
      return `${casualGreeting}${nameRef}, stress is an absolute bugger. ${isInformal ? "Feeling like shit lately?" : "How are you managing?"} Let's work on some strategies to get you feeling better.`;
    }
    
    if (topics.includes('sleep') && specialist.key === 'sleep_psychology') {
      return `${slangPhrase}${nameRef}, sleep issues are the worst. ${isInformal ? "Can't bloody sleep again?" : "How's your rest been?"} Poor sleep messes with everything else.`;
    }
    
    if (topics.includes('depression') && specialist.key === 'psychology') {
      return `${casualGreeting}${nameRef}, depression is a tough bastard to deal with. ${isInformal ? "Feeling pretty shit right now?" : "How are you coping?"} You're not alone in this fight.`;
    }
    
    // Default specialist responses with personality
    return getSpecialistDefaultResponse(specialist, nameRef, isInformal, usesSlang, hasHumor);
  };

  // Add contextual memory to responses
  const addContextualMemory = (response: string, userContext: any, name: string): string => {
    if (userContext.lastBossIssue) {
      response += ` By the way, how's that situation with your boss going${name ? `, ${name}` : ""}?`;
    }
    if (userContext.emotionalState === 'stressed') {
      response += ` Last time you mentioned being pretty stressed - has that improved at all?`;
    }
    return response;
  };

  // Get default response for each specialist with personality
  const getSpecialistDefaultResponse = (
    specialist: Specialist, 
    nameRef: string, 
    isInformal: boolean, 
    usesSlang: boolean, 
    hasHumor: boolean
  ): string => {
    const responses = {
      psychology: [
        `${isInformal ? "That's bloody rough" : "That sounds challenging"}${nameRef}. Mental health is no joke. What's been weighing on you?`,
        `${usesSlang ? "Fair dinkum" : "I understand"}${nameRef}, life can be a real struggle. How are you holding up?`,
        `${isInformal ? "Crikey, that's tough" : "That's difficult"}${nameRef}. You've got the guts to reach out, so let's work through this together.`
      ],
      stress: [
        `${isInformal ? "Stress is a real bastard" : "Stress can be overwhelming"}${nameRef}. What's been the biggest trigger lately?`,
        `${usesSlang ? "Stone the flamin' crows" : "That's intense"}${nameRef}, let's tackle this stress head-on. What's eating at you?`,
        `${isInformal ? "That sounds like a shitstorm" : "That sounds overwhelming"}${nameRef}. How are you managing day to day?`
      ],
      relationship: [
        `${usesSlang ? "Relationships can be a right pain" : "Relationships are complex"}${nameRef}. What's the story?`,
        `${isInformal ? "That's a bloody mess" : "That sounds complicated"}${nameRef}. Communication is key - what's happening?`,
        `${usesSlang ? "Fair shake of the sauce bottle" : "I get it"}${nameRef}, relationships take work. What's on your mind?`
      ],
      // Add more specialists...
    };

    const specialistResponses = responses[specialist.key as keyof typeof responses] || [
      `${isInformal ? "That's rough as guts" : "I'm here to help"}${nameRef}. Tell me what's going on.`
    ];

    return specialistResponses[Math.floor(Math.random() * specialistResponses.length)];
  };
  const updateUserContext = async (userId: string, userMessage: string) => {
    try {
      const currentContext = await getUserContext(userId) || {};
      const updates: any = {};

      // Extract context from user message
      if (userMessage.toLowerCase().includes('boss')) {
        updates.lastBossIssue = 'mentioned boss issues';
      }
      
      if (userMessage.toLowerCase().includes('stress')) {
        updates.emotionalState = 'stressed';
      }

      if (Object.keys(updates).length > 0) {
        await saveUserContext(userId, { ...currentContext, ...updates });
      }
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  };

  // Enhanced template responses with better context awareness
  const getEnhancedTemplateResponses = (specialist: Specialist, name: string, recentMessages: string[]): string[] => {
    // Analyze user's communication style
    const userStyle = getUserStyleSummary(recentMessages);
    const usesSlang = userStyle.includes('slang');
    const isInformal = userStyle.includes('swears') || userStyle.includes('casual');

    // Base responses for different specialists with enhanced variety
    const responses = {
      psychology: [
        `${isInformal ? "That's bloody rough" : "That sounds really challenging"}${name ? ", " + name : ", mate"}. What's been the hardest part for you?`,
        `${usesSlang ? "Fair dinkum" : "I hear you"}${name ? ", " + name : ", mate"}. Life can be a real struggle sometimes. How are you coping?`,
        `No worries${name ? ", " + name : ", mate"}. You're not alone in this. What's been weighing you down?`,
        `${isInformal ? "Crikey" : "That's tough"}${name ? ", " + name : ", mate"}. Thanks for sharing that with me. How long have you been feeling this way?`,
        `${usesSlang ? "Stone the flamin' crows" : "I understand"}${name ? ", " + name : ", mate"}. Mental health can be a real journey. What's your biggest challenge right now?`,
      ],
      stress: [
        `${isInformal ? "Stress is a real bugger" : "Stress can be overwhelming"}${name ? ", " + name : ", mate"}. What's been the biggest trigger lately?`,
        `${usesSlang ? "Bloody hell" : "I get it"}${name ? ", " + name : ", mate"}. Let's take a breather and talk about what's stressing you out.`,
        `${isInformal ? "That sounds like a shitstorm" : "That sounds really intense"}${name ? ", " + name : ", mate"}. How are you managing to get through each day?`,
        `${usesSlang ? "Fair shake of the sauce bottle" : "That's overwhelming"}${name ? ", " + name : ", mate"}. What's been your go-to coping strategy?`,
      ],
      relationship: [
        `${usesSlang ? "Relationships can be a right pain" : "Relationships can be tricky"}${name ? ", " + name : ", mate"}. What's been going on?`,
        `${isInformal ? "That's a bloody mess" : "That sounds complicated"}${name ? ", " + name : ", mate"}. Communication is key. How are you two handling things?`,
        `${usesSlang ? "Fair shake of the sauce bottle" : "I understand"}${name ? ", " + name : ", mate"}. Relationships take work. What's been on your mind?`,
        `${isInformal ? "Crikey, that's rough" : "That's challenging"}${name ? ", " + name : ", mate"}. Have you been able to talk it through with them?`,
      ],
      grief_counseling: [
        `${isInformal ? "That's bloody heartbreaking" : "I'm so sorry for your loss"}${name ? ", " + name : ", mate"}. Grief hits everyone differently. How are you doing today?`,
        `${usesSlang ? "Fair dinkum, that's tough" : "That's incredibly difficult"}${name ? ", " + name : ", mate"}. There's no right way to grieve. What's been helping you cope?`,
        `${isInformal ? "Shit, that's hard" : "That's so difficult"}${name ? ", " + name : ", mate"}. Loss can turn your world upside down. What's been the hardest part?`,
      ],
      addiction: [
        `${isInformal ? "Addiction's a real bastard" : "Addiction is incredibly challenging"}${name ? ", " + name : ", mate"}. You're brave for reaching out. Where are you at in your journey?`,
        `${usesSlang ? "Good on ya" : "I respect you"}${name ? ", " + name : ", mate"} for talking about this. Recovery takes guts. What's been your biggest challenge lately?`,
        `${isInformal ? "That's a tough fight" : "That's a difficult battle"}${name ? ", " + name : ", mate"}. One day at a time, right? How are you feeling today?`,
      ],
      trauma_therapy: [
        `${isInformal ? "Trauma's a real bitch" : "Trauma can be overwhelming"}${name ? ", " + name : ", mate"}. You're safe here. What would help you feel more comfortable talking about this?`,
        `${usesSlang ? "Fair dinkum, that's heavy" : "That sounds incredibly difficult"}${name ? ", " + name : ", mate"}. Healing isn't linear. How are you taking care of yourself?`,
        `${isInformal ? "That's some heavy shit" : "That's really intense"}${name ? ", " + name : ", mate"}. You're stronger than you know. What helps you feel grounded?`,
      ],
      career: [
        `${isInformal ? "Work can be a real pain in the arse" : "Career challenges are tough"}${name ? ", " + name : ", mate"}. What's been eating at you?`,
        `${usesSlang ? "Fair shake" : "I understand"}${name ? ", " + name : ", mate"}. The workplace can be brutal. What's your biggest concern right now?`,
        `${isInformal ? "Boss being a dick again?" : "Having workplace issues?"}${name ? ", " + name : ", mate"}. Tell me what's going on.`,
      ],
      sleep_psychology: [
        `${isInformal ? "Sleep's being a right bastard?" : "Sleep issues are exhausting"}${name ? ", " + name : ", mate"}. How's your bedtime routine been lately?`,
        `${usesSlang ? "Fair dinkum, insomnia's rough" : "Sleep problems are draining"}${name ? ", " + name : ", mate"}. What's been keeping you up?`,
        `${isInformal ? "Can't bloody sleep?" : "Having trouble sleeping?"}${name ? ", " + name : ", mate"}. Let's figure out what's going on with your rest.`,
      ],
      mens_mental_health: [
        `${isInformal ? "Men's mental health is no joke" : "It takes courage to talk about this"}${name ? ", " + name : ", mate"}. How are you really doing?`,
        `${usesSlang ? "Good on ya for reaching out" : "I'm glad you're here"}${name ? ", " + name : ", mate"}. What's been weighing on your mind?`,
        `${isInformal ? "Bloody hell, that's tough" : "That sounds really challenging"}${name ? ", " + name : ", mate"}. Men often carry a lot. What's your biggest struggle right now?`,
      ],
      empathy_specialist: [
        `${isInformal ? "That's rough as guts" : "I can feel your pain"}${name ? ", " + name : ", mate"}. You're not alone in this. What would help you feel more understood?`,
        `${usesSlang ? "Fair dinkum, I hear ya" : "I really hear you"}${name ? ", " + name : ", mate"}. Sometimes we just need someone to listen. Tell me more.`,
        `${isInformal ? "That's bloody awful" : "That must be so difficult"}${name ? ", " + name : ", mate"}. I'm here with you. What do you need right now?`,
      ],
    };

    const specialistResponses = responses[specialist.key as keyof typeof responses] || [
      `${isInformal ? "That's rough as guts" : "I'm here to help"}${name ? ", " + name : ", mate"}. Tell me more about what's going on.`
    ];

    return specialistResponses;
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

      // Generate AI response (now async)
      try {
        const aiResponseContent = await generateAIResponse(content.trim(), specialist!);
        
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
      } catch (aiError) {
        console.error('AI response failed:', aiError);
        // Fallback to simple response
        const fallbackResponse: Message = {
          id: Date.now() + 1,
          content: "Sorry mate, I'm having a bit of trouble right now. Can you try again?",
          sender: 'specialist',
          timestamp: new Date(),
          conversationId: targetConversationId!
        };

        const finalMessages = [...updatedMessages, fallbackResponse];
        setMessages(finalMessages);
        localStorage.setItem(`conversation_${targetConversationId}_messages`, JSON.stringify(finalMessages));
      } finally {
        setIsTyping(false);
      }

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

  // Load specialists from JSON file on component mount
  useEffect(() => {
    const loadSpecialists = async () => {
      try {
        const response = await fetch('/local_data/specialists.json');
        if (response.ok) {
          const specialistData = await response.json();
          // Add id field for compatibility
          const specialistsWithId = specialistData.map((specialist: any, index: number) => ({
            id: index + 1,
            ...specialist
          }));
          setSpecialists(specialistsWithId);
        } else {
          console.warn('Failed to load specialists from JSON');
        }
      } catch (error) {
        console.error('Error loading specialists:', error);
      }
    };

    loadSpecialists();
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
              {/* AI Status Indicator - Offline App */}
              {aiInitialized && (
                <div className="text-xs text-green-300 bg-green-900/20 px-2 py-1 rounded">
                  AI Ready
                </div>
              )}
              {aiLoading && (
                <div className="text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded">
                  Loading AI...
                </div>
              )}
              {!aiInitialized && !aiLoading && (
                <div className="text-xs text-orange-300 bg-orange-900/20 px-2 py-1 rounded">
                  Offline Mode
                </div>
              )}
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
