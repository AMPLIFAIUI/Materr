import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const specialists = pgTable("specialists", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  specialistId: integer("specialist_id").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' or 'specialist'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  specialistKey: text("specialist_key").notNull(),
  domain: text("domain").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  researcherAuthors: text("researcher_authors").notNull(),
  publicationYear: integer("publication_year").notNull(),
  journalInstitution: text("journal_institution").notNull(),
  evidenceLevel: text("evidence_level").notNull(), // 'meta-analysis', 'rct', 'cohort', 'case-control', 'expert-opinion'
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crisisServices = pgTable("crisis_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  region: text("region"),
  serviceType: text("service_type").notNull(),
  isAvailable24h: boolean("is_available_24h").default(false).notNull(),
  operatingHours: text("operating_hours"),
  description: text("description").notNull(),
  website: text("website"),
  languages: text("languages").array(),
  specializations: text("specializations").array(),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  conversationId: integer("conversation_id").notNull(),
  riskLevel: text("risk_level").notNull(),
  triggerMessage: text("trigger_message").notNull(),
  location: text("location"),
  contactsAlerted: text("contacts_alerted").array(),
  timestamp: timestamp("timestamp").defaultNow(),
  resolved: boolean("resolved").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSpecialistSchema = createInsertSchema(specialists).omit({
  id: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true,
});

export const insertCrisisServiceSchema = createInsertSchema(crisisServices).omit({
  id: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Specialist = typeof specialists.$inferSelect;
export type InsertSpecialist = z.infer<typeof insertSpecialistSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type CrisisService = typeof crisisServices.$inferSelect;
export type InsertCrisisService = z.infer<typeof insertCrisisServiceSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
