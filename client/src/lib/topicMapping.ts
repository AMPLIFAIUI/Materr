// src/lib/topicMapping.ts
// Maps user messages to clinical topic tags for AI prompt logic

// Map of keywords/phrases to topic tags (expand as needed)
const topicKeywordMap: Record<string, string[]> = {
  // Stress
  "stress": ["stress", "overwhelmed", "burnt out", "burnout", "pressure", "anxious", "anxiety", "panic", "tension", "workload", "deadline", "cortisol", "overwork", "can't cope", "too much", "swamped", "exhausted", "fatigue", "worn out", "fried"],
  // Grief
  "grief": ["grief", "loss", "bereavement", "passed away", "funeral", "mourning", "lost someone", "death", "gone forever", "miss them"],
  // Addiction
  "addiction": ["addiction", "alcohol", "drugs", "gambling", "can't stop", "using", "relapse", "sober", "clean", "substance", "drinking", "smoking", "weed", "pills", "binge"],
  // Sleep
  "sleep": ["sleep", "insomnia", "can't sleep", "tired", "restless", "nightmare", "waking up", "sleeping", "nap", "fatigue", "rest"],
  // Conflict
  "conflict": ["fight", "argument", "conflict", "disagreement", "falling out", "row", "beef", "tension", "clash", "not talking", "drama"],
  // Relationship
  "relationship": ["relationship", "partner", "boyfriend", "girlfriend", "breakup", "divorce", "dating", "marriage", "cheating", "trust", "love", "crush", "ex"],
  // Career
  "career": ["job", "work", "career", "boss", "promotion", "fired", "unemployed", "interview", "resume", "CV", "pay", "salary", "colleague", "workplace", "office", "shift", "overtime"],
  // Psychology
  "psychology": ["depressed", "depression", "mental health", "therapy", "therapist", "counselor", "psychologist", "CBT", "trauma", "PTSD", "diagnosed", "diagnosis", "mood", "sad", "hopeless", "worthless", "can't go on", "no motivation", "empty", "crying"],
  // Self-esteem
  "selfesteem": ["self-esteem", "confidence", "insecure", "worthless", "not good enough", "hate myself", "self-doubt", "ashamed", "embarrassed", "proud", "self-respect"],
  // Anger
  "anger": ["angry", "anger", "rage", "furious", "pissed off", "snapped", "lost it", "mad", "irritated", "annoyed", "temper", "outburst"],
  // Social
  "social": ["social", "friends", "lonely", "alone", "isolated", "awkward", "party", "group", "meeting", "network", "shy", "introvert", "extrovert", "social anxiety"],
  // Family
  "family": ["family", "mum", "dad", "parent", "sibling", "brother", "sister", "uncle", "aunt", "cousin", "child", "kids", "son", "daughter", "home life", "household", "stepdad", "stepmum"],
  // Fitness
  "fitness": ["fitness", "exercise", "workout", "gym", "run", "jog", "walk", "bike", "swim", "sport", "training", "coach", "athlete", "fit", "unfit", "weight", "diet", "nutrition", "calories", "muscle", "fat"],
};

// Returns an array of topic tags found in the message
export function mapUserMessageToTags(message: string): string[] {
  const tags: Set<string> = new Set();
  const lowerMsg = message.toLowerCase();
  for (const [tag, keywords] of Object.entries(topicKeywordMap)) {
    for (const kw of keywords) {
      if (lowerMsg.includes(kw)) {
        tags.add(tag);
        break;
      }
    }
  }
  return Array.from(tags);
}
