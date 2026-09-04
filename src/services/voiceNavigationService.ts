/**
 * VoltConnect 2.0 — Voice Navigation Service
 * Centralized intent detection, transcript normalization, and route command matching.
 */

import { parseVoiceAction, VoiceActionResult, VoiceActionIntent, ExtractedParameters, voiceContextStore } from './voiceActionEngine';

export interface VoiceRouteDefinition {
  id: string;
  path: string;
  label: string;
  keywords: string[];
  description: string;
  aliases: string[];
}

export interface VoiceCommandMatch {
  matched: boolean;
  intent: 'NAVIGATE' | 'GO_BACK' | 'ACTION' | 'UNKNOWN';
  actionIntent?: VoiceActionIntent;
  targetRoute?: string;
  targetLabel?: string;
  confidence: number;
  rawTranscript: string;
  normalizedTranscript: string;
  matchedKeyword?: string;
  parameters?: ExtractedParameters;
  feedbackTitle?: string;
  feedbackMessage?: string;
  navigationState?: Record<string, any>;
  contextApplied?: boolean;
}

// Complete Master Route Mapping for VoltConnect 2.0
export const VOICE_ROUTES: VoiceRouteDefinition[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Home Dashboard',
    description: 'Driver Overview & EV Metrics',
    keywords: ['dashboard', 'home', 'overview', 'main', 'driver dashboard', 'dash', 'main screen', 'home page', 'summary'],
    aliases: [
      'open dashboard',
      'go to dashboard',
      'show dashboard',
      'take me to dashboard',
      'navigate to dashboard',
      'open home',
      'go home',
      'show home',
      'take me home',
      'open main page',
      'go to main',
    ],
  },
  {
    id: 'voltmap',
    path: '/explore',
    label: 'VoltMap',
    description: 'Nationwide Charging Network Map',
    keywords: ['map', 'voltmap', 'explore', 'chargers', 'charging stations', 'find chargers', 'stations', 'nearby chargers', 'where to charge', 'station map', 'ev map'],
    aliases: [
      'open map',
      'go to map',
      'show map',
      'open voltmap',
      'go to voltmap',
      'show voltmap',
      'find charging stations',
      'find chargers',
      'show nearby chargers',
      'take me to map',
      'navigate to map',
      'open explore',
      'explore chargers',
    ],
  },
  {
    id: 'trips',
    path: '/trips',
    label: 'Smart Trip Planner',
    description: 'Corridor Routing & Readiness',
    keywords: ['trips', 'trip', 'planner', 'route', 'routes', 'plan journey', 'plan trip', 'volttrip', 'corridor', 'journey planner', 'trip planner', 'navigation'],
    aliases: [
      'open trips',
      'go to trips',
      'show trips',
      'plan a trip',
      'plan journey',
      'open trip planner',
      'go to trip planner',
      'show trip planner',
      'take me to trips',
      'route planner',
      'open route planner',
      'calculate route',
      'plan my route',
    ],
  },
  {
    id: 'garage',
    path: '/garage',
    label: 'Garage & Vehicles',
    description: 'My Electric Vehicles & Fleet',
    keywords: ['garage', 'vehicles', 'my ev', 'my car', 'cars', 'fleet', 'vehicle list', 'evs', 'my vehicle', 'car settings', 'vehicle garage'],
    aliases: [
      'open garage',
      'go to garage',
      'show garage',
      'open my ev',
      'go to my ev',
      'show my ev',
      'my vehicles',
      'show vehicles',
      'open vehicles',
      'view my car',
      'take me to garage',
      'open car settings',
    ],
  },
  {
    id: 'health',
    path: '/health',
    label: 'VoltHealth SOH',
    description: 'Battery Health & Diagnostics',
    keywords: ['health', 'volthealth', 'battery health', 'soh', 'battery diagnostics', 'battery status', 'battery life', 'cell health', 'state of health'],
    aliases: [
      'open health',
      'go to health',
      'show health',
      'open volthealth',
      'go to volthealth',
      'show volthealth',
      'check battery health',
      'battery health',
      'show battery health',
      'battery diagnostics',
      'view battery status',
      'state of health',
    ],
  },
  {
    id: 'care',
    path: '/care',
    label: 'VoltCare Service',
    description: 'Maintenance & Service Booking',
    keywords: ['care', 'voltcare', 'service', 'maintenance', 'repair', 'repairs', 'mechanic', 'technician', 'book service', 'schedule maintenance', 'service history'],
    aliases: [
      'open care',
      'go to care',
      'show care',
      'open voltcare',
      'go to voltcare',
      'show voltcare',
      'book service',
      'schedule service',
      'open maintenance',
      'service center',
      'view maintenance',
      'schedule maintenance',
    ],
  },
  {
    id: 'insight',
    path: '/insight',
    label: 'VoltInsight Analytics',
    description: 'Charging Expenses & Analytics',
    keywords: ['insight', 'insights', 'voltinsight', 'analytics', 'cost analytics', 'expenses', 'stats', 'charging cost', 'energy analytics', 'spending'],
    aliases: [
      'open insight',
      'go to insight',
      'show insight',
      'open insights',
      'open voltinsight',
      'go to voltinsight',
      'show analytics',
      'open analytics',
      'view expenses',
      'show charging cost',
      'cost analytics',
    ],
  },
  {
    id: 'volt-ai',
    path: '/volt-ai',
    label: 'VoltAI Copilot',
    description: 'Contextual AI Assistant',
    keywords: [
      'ai',
      'voltai',
      'copilot',
      'assistant',
      'smart assistant',
      'bot',
      'chat',
      'ask ai',
      'ai copilot',
      'volt ai',
      'voltai analytics',
      'volt ai analytics',
      'volta ai',
      'volt a i',
      'ai analytics',
    ],
    aliases: [
      'voltai',
      'volt ai',
      'volta ai',
      'volt a i',
      'volt a.i.',
      'voltai analytics',
      'volt ai analytics',
      'volta ai analytics',
      'volt a.i. analytics',
      'open voltai',
      'open volt ai',
      'open volta ai',
      'open volt a i',
      'open volt a.i.',
      'open voltai analytics',
      'open volt ai analytics',
      'open volta ai analytics',
      'open volt a.i. analytics',
      'show voltai',
      'show volt ai',
      'show volta ai',
      'show voltai analytics',
      'show volt ai analytics',
      'go to voltai',
      'go to volt ai',
      'go to volta ai',
      'go to voltai analytics',
      'go to volt ai analytics',
      'launch voltai',
      'launch volt ai',
      'launch volta ai',
      'launch voltai analytics',
      'launch volt ai analytics',
      'open ai',
      'go to ai',
      'show ai',
      'open copilot',
      'ask copilot',
      'open assistant',
      'ask ai',
      'talk to ai',
    ],
  },
  {
    id: 'profile',
    path: '/profile',
    label: 'Driver Profile & Settings',
    description: 'Account & Preferences',
    keywords: ['profile', 'account', 'settings', 'user profile', 'my profile', 'preferences', 'my account', 'driver profile', 'user settings'],
    aliases: [
      'open profile',
      'go to profile',
      'show profile',
      'open my profile',
      'view profile',
      'open settings',
      'go to settings',
      'show settings',
      'account settings',
      'open account',
      'take me to profile',
    ],
  },
  {
    id: 'sos',
    path: '/sos',
    label: 'VoltSOS Emergency',
    description: '24/7 Roadside Assistance',
    keywords: ['sos', 'emergency', 'help', 'breakdown', 'roadside assistance', 'voltsos', 'towing', 'urgent assistance'],
    aliases: [
      'open sos',
      'help',
      'emergency',
      'roadside assistance',
      'i need help',
      'open emergency',
      'call sos',
    ],
  },
];

/**
 * Normalizes speech recognition text:
 * - Lowercase & trim
 * - Removes trailing/leading punctuation
 * - Collapses extra spaces
 * - Normalizes common compound terms ('volt map' -> 'voltmap', 'volt ai' -> 'voltai')
 */
export function normalizeVoiceTranscript(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.toLowerCase().trim();

  // Remove punctuation
  text = text.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ');

  // Normalize multiple spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Normalize phonetic/compound terms
  text = text
    .replace(/\bvolt\s+map\b/g, 'voltmap')
    .replace(/\bvolt\s+trip\b/g, 'volttrip')
    .replace(/\bvolta\s+ai\b/g, 'voltai')
    .replace(/\bvolt\s+a\s*i\b/g, 'voltai')
    .replace(/\bvolt\s+ai\b/g, 'voltai')
    .replace(/\bvolt\s+health\b/g, 'volthealth')
    .replace(/\bvolt\s+care\b/g, 'voltcare')
    .replace(/\bvolt\s+insight\b/g, 'voltinsight')
    .replace(/\bvolt\s+sos\b/g, 'voltsos')
    .replace(/\be\s*v\b/g, 'ev')
    .replace(/\bs\s*o\s*h\b/g, 'soh');

  return text;
}

/**
 * Resolves a normalized speech transcript into a structured navigation intent.
 */
export function resolveVoiceCommand(rawTranscript: string): VoiceCommandMatch {
  // 1. Delegate to Voice Action Engine for Natural Language & Parameters
  const actionRes = parseVoiceAction(rawTranscript);
  if (actionRes.matched) {
    if (actionRes.intent === 'GO_BACK') {
      return {
        matched: true,
        intent: 'GO_BACK',
        targetLabel: 'Previous Page',
        confidence: actionRes.confidence,
        rawTranscript,
        normalizedTranscript: actionRes.normalizedTranscript,
        feedbackTitle: actionRes.feedbackTitle,
        feedbackMessage: actionRes.feedbackMessage,
      };
    }

    if (actionRes.intent.startsWith('NAVIGATE_')) {
      return {
        matched: true,
        intent: 'NAVIGATE',
        actionIntent: actionRes.intent,
        targetRoute: actionRes.targetRoute,
        targetLabel: actionRes.feedbackTitle?.replace(/^OPEN\s+/, '') || 'Page',
        confidence: actionRes.confidence,
        rawTranscript,
        normalizedTranscript: actionRes.normalizedTranscript,
        parameters: actionRes.parameters,
        feedbackTitle: actionRes.feedbackTitle,
        feedbackMessage: actionRes.feedbackMessage,
        navigationState: actionRes.navigationState,
      };
    }

    // Contextual Action Intents (PLAN_TRIP, CALCULATE_CHARGING_COST, FIND_CHARGERS, etc.)
    return {
      matched: true,
      intent: 'ACTION',
      actionIntent: actionRes.intent,
      targetRoute: actionRes.targetRoute,
      targetLabel: actionRes.feedbackTitle || 'Action',
      confidence: actionRes.confidence,
      rawTranscript,
      normalizedTranscript: actionRes.normalizedTranscript,
      parameters: actionRes.parameters,
      feedbackTitle: actionRes.feedbackTitle,
      feedbackMessage: actionRes.feedbackMessage,
      navigationState: actionRes.navigationState,
      contextApplied: actionRes.contextApplied,
    };
  }

  // 2. Strict Negative Guards (Anti-collusion for "world" and "volt")
  const norm = normalizeVoiceTranscript(rawTranscript);
  if (norm === 'world' || norm === 'word' || norm === 'volt') {
    return {
      matched: false,
      intent: 'UNKNOWN',
      confidence: 0,
      rawTranscript,
      normalizedTranscript: norm,
      feedbackMessage: actionRes.feedbackMessage,
    };
  }

  // 3. Fallback Route Matching against Defined Aliases & Keywords
  for (const route of VOICE_ROUTES) {
    for (const alias of route.aliases) {
      const normAlias = normalizeVoiceTranscript(alias);
      if (norm === normAlias) {
        return {
          matched: true,
          intent: 'NAVIGATE',
          targetRoute: route.path,
          targetLabel: route.label,
          confidence: 1.0,
          rawTranscript,
          normalizedTranscript: norm,
          matchedKeyword: alias,
        };
      }
    }
  }

  // 4. Keyword / Substring Match with Scoring
  let bestMatch: { route: VoiceRouteDefinition; score: number; keyword: string } | null = null;
  const stripped = norm
    .replace(/^(open|go to|take me to|navigate to|show|view|switch to|display|launch|load|i want to see|please open|please go to)\s+/i, '')
    .trim();

  for (const route of VOICE_ROUTES) {
    for (const kw of route.keywords) {
      const normKw = normalizeVoiceTranscript(kw);
      if (stripped === normKw) {
        return {
          matched: true,
          intent: 'NAVIGATE',
          targetRoute: route.path,
          targetLabel: route.label,
          confidence: 0.95,
          rawTranscript,
          normalizedTranscript: norm,
          matchedKeyword: kw,
        };
      }

      const regex = new RegExp(`\\b${normKw}\\b`, 'i');
      if (regex.test(norm)) {
        const score = normKw.length / norm.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { route, score, keyword: kw };
        }
      }
    }
  }

  if (bestMatch && bestMatch.score >= 0.25) {
    return {
      matched: true,
      intent: 'NAVIGATE',
      targetRoute: bestMatch.route.path,
      targetLabel: bestMatch.route.label,
      confidence: Math.min(0.9, 0.6 + bestMatch.score),
      rawTranscript,
      normalizedTranscript: norm,
      matchedKeyword: bestMatch.keyword,
    };
  }

  // 5. No Command Recognized
  return {
    matched: false,
    intent: 'UNKNOWN',
    confidence: 0,
    rawTranscript,
    normalizedTranscript: norm,
    feedbackMessage: actionRes.feedbackMessage || `Command "${rawTranscript}" not recognized.`,
  };
}
