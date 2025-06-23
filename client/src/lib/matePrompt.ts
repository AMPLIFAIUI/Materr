// src/lib/matePrompt.ts
// Core logic for mate-to-mate AI prompt assembly, style mirroring, and context memory

import { getUserContext, saveUserContext } from "./userContext";

// 1. System prompt for mate-to-mate tone
export const SYSTEM_PROMPT = `
You are a supportive Aussie mate, not a therapist or robot.
- Use casual, everyday language, Aussie slang, and swearing if the user does.
- Mirror the user’s tone, humor, and style.
- Avoid clinical jargon—never use words like “diagnosis”, “treatment”, or “disorder”.
- Show empathy, concern, and a bit of dry humor.
- Remember details from previous chats and bring them up naturally.
- Challenge the user if needed, but always be supportive.
- Use phrases like “Mate, that sounds rough”, “Fair dinkum”, “No worries”, “How you holding up?”, “What’s the damage this week?”, “Come on mate, you know that’s not true.”
- After tough events, help the user reflect: “Let’s figure out what went wrong—time for a post-mortem, mate.”
- Track progress and celebrate small wins.
`;

// 2. Analyze user style from recent messages
export function getUserStyleSummary(messages: string[]): string {
  let swearing = 0, slang = 0, humor = 0, formal = 0;
  messages.forEach(msg => {
    if (/\b(fuck|shit|bloody|arse|dick|bugger|bastard)\b/i.test(msg)) swearing++;
    if (/\b(aye|mate|reckon|cheers|no worries|fair dinkum|arvo|brekkie|servo|bottle-o)\b/i.test(msg)) slang++;
    if (/\blol|haha|cheeky|banter|piss take|stirring\b/i.test(msg)) humor++;
    if (/\btherefore|however|regarding|consequently\b/i.test(msg)) formal++;
  });
  if (swearing > 1) return "The user swears a lot. Respond with casual language and swearing.";
  if (slang > 1) return "The user uses Aussie slang. Respond with slang and casual tone.";
  if (humor > 1) return "The user jokes around. Respond with humor and banter.";
  if (formal > 1) return "The user is formal. Respond a bit more formally, but still as a mate.";
  return "The user is casual. Respond in a friendly, relaxed way.";
}

// 3. Context memory management
export async function getContextMemory(userId: string): Promise<string> {
  const context = await getUserContext(userId);
  if (!context) return "";
  let memory = [];
  if (context.lastBossIssue)
    memory.push(`Last time, the user mentioned their boss was being a dick. Ask about that.`);
  if (context.lastEvent)
    memory.push(`User recently had: ${context.lastEvent}`);
  if (context.emotionalState)
    memory.push(`User was feeling: ${context.emotionalState}`);
  return memory.join("\n");
}

// 4. Prompt assembly
export async function buildMatePrompt({
  userId,
  recentMessages,
  userMessage
}: {
  userId: string,
  recentMessages: string[],
  userMessage: string
}): Promise<string> {
  const styleSummary = getUserStyleSummary(recentMessages);
  const contextMemory = await getContextMemory(userId);
  return `
${SYSTEM_PROMPT}
User style: ${styleSummary}
Context: ${contextMemory}
Conversation:
User: ${userMessage}
Mate:
`;
}

// Example: Integrate mate prompt into chat message sending
// Usage in your chat send handler (e.g., in chat.tsx):
//
// import { buildMatePrompt } from "@/lib/matePrompt";
// import { saveUserContext } from "@/lib/userContext";
//
// async function handleSend(userId: string, recentMessages: string[], userMessage: string) {
//   // Optionally update context memory here based on userMessage
//   // Example: if (userMessage.includes("boss")) await saveUserContext(userId, { lastBossIssue: "boss trouble" });
//   const prompt = await buildMatePrompt({ userId, recentMessages, userMessage });
//   // Send prompt to your local AI model (llama.cpp server or plugin)
//   const aiReply = await fetch("http://localhost:8000/completion", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ prompt, n_predict: 128 })
//   }).then(res => res.json());
//   // Display aiReply.content in chat
// }
