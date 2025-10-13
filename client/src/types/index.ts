// Simple types for offline app - no database dependencies

export interface SpecialistTheme {
  gradient?: string;
  avatarBg?: string;
  avatarText?: string;
  assistantBubble?: string;
  assistantText?: string;
  userBubble?: string;
  userText?: string;
  accent?: string;
  chip?: string;
  color?: string;
}

export interface SpecialistKnowledgeBase {
  persona?: string;
  focusAreas?: string[];
  techniques?: string[];
  conversationStarters?: string[];
  supportPhrases?: string[];
}

export interface Specialist {
  id: number;
  key: string;
  name: string;
  specialty: string;
  description: string;
  icon: string;
  color: string;
  aliases?: string[];
  theme?: SpecialistTheme;
  knowledgeBase?: SpecialistKnowledgeBase;
}

export interface User {
  id: number;
  username: string;
}

export interface Conversation {
  id: number;
  userId?: number;
  specialistId: number;
  specialistKey?: string;
  title?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Message {
  id: number;
  conversationId: number;
  content: string;
  sender: 'user' | 'specialist';
  timestamp?: Date;
}

export interface KnowledgeBase {
  id: number;
  specialistKey: string;
  domain: string;
  title: string;
  content: string;
  source: string;
  researcherAuthors: string;
  publicationYear: number;
  journalInstitution: string;
  evidenceLevel: 'meta-analysis' | 'rct' | 'cohort' | 'case-control' | 'expert-opinion';
  tags?: string[];
  createdAt?: Date;
}

export interface EmergencyContact {
  id: number;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
  createdAt?: Date;
}

export interface CrisisService {
  id: number;
  name: string;
  phoneNumber: string;
  description: string;
  availability: string;
  region: string;
  isEmergency: boolean;
}

export interface EmergencyAlert {
  id: number;
  userId: number;
  alertType: 'crisis' | 'emergency' | 'wellness_check';
  message: string;
  isActive: boolean;
  timestamp?: Date;
}
