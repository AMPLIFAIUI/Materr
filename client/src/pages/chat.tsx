import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MessageBubble } from "@/components/message-bubble";
import { TypingIndicator } from "@/components/typing-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Message, Conversation, Specialist } from "@shared/schema";

export default function Chat() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationId = parseInt(id || '0');

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: () => fetch(`/api/conversations/${conversationId}/messages`, { credentials: 'include' }).then(res => res.json())
  });

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ['/api/conversations', conversationId],
    queryFn: () => fetch(`/api/conversations/${conversationId}`, { credentials: 'include' }).then(res => res.json()),
    enabled: false // We'll get specialist info from the message response
  });

  const [specialist, setSpecialist] = useState<Specialist | null>(null);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, {
        content
      });
      return response.json();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setSpecialist(data.specialist);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
    }
  });

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(trimmedMessage);
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
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
      const welcomeMessage = `G'day mate! I'm ${specialist.name}, your ${specialist.specialty.toLowerCase()}. I'm here to help you work through whatever's on your mind. What's going on?`;
      
      // We can simulate this or update the backend to automatically create a welcome message
    }
  }, [messages, isLoading, specialist]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl min-h-screen relative flex flex-col">
        {/* Header */}
        <header className="bg-primary dark:bg-gray-800 text-white p-4 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setLocation('/specialists')}
                className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">
                  {specialist?.name || 'Mate'}
                </h1>
                <p className="text-blue-200 dark:text-gray-300 text-sm">
                  {specialist ? `${specialist.specialty} • Online` : 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors">
                <i className="fas fa-user-circle text-xl"></i>
              </button>
              <button className="p-2 hover:bg-blue-600 dark:hover:bg-gray-700 rounded-full transition-colors">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="bg-gray-300 dark:bg-gray-600 rounded-2xl p-4 max-w-xs h-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Welcome message when no messages exist */}
              {messages.length === 0 && (
                <MessageBubble
                  content="G'day mate! I'm here to help you work through whatever's on your mind. What's going on?"
                  sender="specialist"
                  timestamp={new Date()}
                  specialistName={specialist?.name}
                  specialistSpecialty={specialist?.specialty}
                />
              )}
              
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  sender={msg.sender as 'user' | 'specialist'}
                  timestamp={msg.timestamp ? new Date(msg.timestamp) : undefined}
                  specialistName={specialist?.name}
                  specialistSpecialty={specialist?.specialty}
                />
              ))}
              
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-800">
          <div className="flex items-end space-x-3">
            <button className="p-3 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 pr-12 resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[48px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={1}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="absolute right-2 bottom-2 p-2 text-primary dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Quick Response Suggestions */}
          <div className="flex space-x-2 mt-3 overflow-x-auto">
            {quickResponses.map((response, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickResponse(response)}
                className="bg-gray-100 dark:bg-gray-700 text-secondary dark:text-white px-4 py-2 rounded-full text-sm whitespace-nowrap hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-gray-200 dark:border-gray-600"
              >
                {response}
              </Button>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-around py-2">
            <button className="flex flex-col items-center py-2 px-4 text-primary dark:text-blue-400">
              <i className="fas fa-comment text-lg mb-1"></i>
              <span className="text-xs">Chat</span>
            </button>
            <button 
              onClick={() => setLocation('/specialists')}
              className="flex flex-col items-center py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors"
            >
              <i className="fas fa-users text-lg mb-1"></i>
              <span className="text-xs">Specialists</span>
            </button>
            <button className="flex flex-col items-center py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors">
              <i className="fas fa-chart-line text-lg mb-1"></i>
              <span className="text-xs">Progress</span>
            </button>
            <button className="flex flex-col items-center py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors">
              <i className="fas fa-user text-lg mb-1"></i>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
