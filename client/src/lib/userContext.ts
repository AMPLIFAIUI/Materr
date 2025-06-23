// src/lib/userContext.ts
// Simple local user context memory for mate AI

export interface UserContext {
  lastBossIssue?: string;
  lastEvent?: string;
  emotionalState?: string;
  // Add more fields as needed
}

// For demo: use localStorage (replace with encrypted storage for production)
export async function getUserContext(userId: string): Promise<UserContext | null> {
  const raw = localStorage.getItem(`mate_user_ctx_${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveUserContext(userId: string, ctx: UserContext): Promise<void> {
  localStorage.setItem(`mate_user_ctx_${userId}`, JSON.stringify(ctx));
}
