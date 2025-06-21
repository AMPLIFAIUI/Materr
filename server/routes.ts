import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./services/openai";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all specialists
  app.get("/api/specialists", async (req, res) => {
    try {
      const specialists = await storage.getAllSpecialists();
      res.json(specialists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch specialists" });
    }
  });

  // Get specialist by key
  app.get("/api/specialists/:key", async (req, res) => {
    try {
      const specialist = await storage.getSpecialistByKey(req.params.key);
      if (!specialist) {
        return res.status(404).json({ message: "Specialist not found" });
      }
      res.json(specialist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch specialist" });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get conversation messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message and get AI response
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Get conversation details
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Get specialist details
      const specialist = await storage.getSpecialist(conversation.specialistId);
      if (!specialist) {
        return res.status(404).json({ message: "Specialist not found" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        content,
        sender: 'user'
      });

      // Get conversation history for context
      const existingMessages = await storage.getMessagesByConversation(conversationId);
      const conversationHistory = existingMessages
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Generate AI response
      const aiResponse = await generateChatResponse(
        content,
        specialist.key,
        conversationHistory
      );

      // Save AI response
      const assistantMessage = await storage.createMessage({
        conversationId,
        content: aiResponse.message,
        sender: 'specialist'
      });

      res.json({
        userMessage,
        assistantMessage,
        specialist: {
          name: specialist.name,
          specialty: specialist.specialty
        }
      });

    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
