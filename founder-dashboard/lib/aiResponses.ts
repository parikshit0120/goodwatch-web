import { TabName } from '@/types';

export function getProactiveSuggestion(tab: TabName): string {
  const responses: Record<TabName, string> = {
    Product: "Based on your current metrics, I'd suggest focusing on retention. Consider adding an onboarding improvement task - your 7D retention is below target. What specific friction points are users hitting?",
    Growth: "Your new user acquisition is below target. I'd recommend:\n1. Launch a Product Hunt campaign (see your backlog)\n2. Optimize your App Store listing\n3. Test referral incentives\n\nWhich would move the needle fastest?",
    Marketing: "Check your ship log - when was the last time you shipped a marketing experiment? Try posting 3 Instagram Reels this week targeting decision fatigue pain points.",
    Tech: "Looking at your tasks, consider prioritizing the Firebase export script. Without data, you can't optimize. This unblocks analytics and constraint detection.",
    Monetization: "Revenue is at $0. Before building payment features, validate willingness to pay. Add a task: 'Interview 10 users about paid features'. Start there.",
    Partnerships: "For partnerships, focus on distribution channels. Which content platforms or app stores could give you 10x reach? List 3 potential partners and draft outreach messages.",
    Bugs: "Check your bug backlog. Are there any bugs that directly impact retention or conversion? Those should be your top priority.",
    Analytics: "Analytics tracking looks good. Now the question is: what are you learning? Add a weekly review task to extract insights and adjust strategy.",
    Experiments: "Running experiments is great, but are you shipping winners? Review your recent experiments and ship the validated improvements.",
    Content: "Content marketing compound. Pick ONE channel (Twitter, Instagram, LinkedIn) and commit to daily posts for 30 days. Which channel has your best user overlap?",
    Context: "Context notes help AI give better suggestions. Document your key decisions, user insights, and strategic pivots here.",
  };

  return responses[tab] || `For ${tab}, focus on the highest impact task with the nearest deadline. What's blocking you from shipping something today?`;
}

export function generateChatResponse(userMessage: string, tab: TabName): string {
  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('retention') || lowerMessage.includes('churn')) {
    return "Retention issues often stem from poor onboarding or missing core value. Have you mapped out your Day 1, Day 3, and Day 7 user experience? Find the drop-off point and fix that first.";
  }

  if (lowerMessage.includes('growth') || lowerMessage.includes('users')) {
    return "For growth, focus on: 1) Making your current users successful (they'll refer others), 2) Optimizing your App Store presence, 3) Testing viral loops. What's your current virality coefficient?";
  }

  if (lowerMessage.includes('revenue') || lowerMessage.includes('monetiz')) {
    return "Before building payment features, validate willingness to pay. Talk to 10 power users and ask: 'What would make this worth $X/month to you?' Their answers will guide your pricing and features.";
  }

  if (lowerMessage.includes('marketing') || lowerMessage.includes('content')) {
    return "Content marketing works if you're consistent. Pick ONE channel, post daily for 30 days, and measure what resonates. Don't spread thin across multiple platforms yet.";
  }

  if (lowerMessage.includes('bug') || lowerMessage.includes('fix')) {
    return "Not all bugs are equal. Triage by: 1) Does it block core functionality? 2) Does it affect many users? 3) Is it easy to fix? Ship quick wins while planning the hard fixes.";
  }

  if (lowerMessage.includes('priority') || lowerMessage.includes('what should')) {
    return `For ${tab}, look at your constraint. Your biggest bottleneck right now should guide what you work on. What's stopping you from hitting your targets?`;
  }

  // Default response
  return `That's a good question for ${tab}. Based on your current metrics and tasks, I'd recommend focusing on the highest impact work. Want me to help you prioritize your backlog?`;
}
