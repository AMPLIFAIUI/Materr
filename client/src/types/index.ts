// Simple types for offline app - no database dependencies

export interface User {
  id: number;
  username: string;
}

export interface Specialist {
  id: number;
  key: string;
  name: string;
  specialty: string;
  description: string;
  icon: string;
  color: string;
}

export interface Conversation {
  id: number;
  userId?: number;
  specialistId: number;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
