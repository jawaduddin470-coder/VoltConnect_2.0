/**
 * VoltConnect 2.0 — Voice Navigation Service
 * Centralized intent detection, transcript normalization, and route command matching.
 */

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
  intent: 'NAVIGATE' | 'GO_BACK' | 'UNKNOWN';
  targetRoute?: string;
  targetLabel?: string;
  confidence: number;
  rawTranscript: string;
  normalizedTranscript: string;
  matchedKeyword?: string;
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
    keywords: ['ai', 'voltai', 'copilot', 'assistant', 'smart assistant', 'bot', 'chat', 'ask ai', 'ai copilot', 'volt ai'],
    aliases: [
      'open ai',
      'go to ai',
      'show ai',
      'open voltai',
      'go to voltai',
      'show voltai',
      'open copilot',
      'ask copilot',
      'open assistant',
      'open volt ai',
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
  const normalized = normalizeVoiceTranscript(rawTranscript);

  if (!normalized) {
    return {
      matched: false,
      intent: 'UNKNOWN',
      confidence: 0,
      rawTranscript,
      normalizedTranscript: '',
    };
  }

  // 1. Check for "Back" / "Go Back" Navigation Intent
  const backKeywords = ['go back', 'back', 'previous', 'previous page', 'return', 'take me back', 'navigate back'];
  for (const bw of backKeywords) {
    if (normalized === bw || normalized.startsWith(bw + ' ') || normalized.endsWith(' ' + bw)) {
      return {
        matched: true,
        intent: 'GO_BACK',
        targetLabel: 'Previous Page',
        confidence: 0.98,
        rawTranscript,
        normalizedTranscript: normalized,
        matchedKeyword: bw,
      };
    }
  }

  // 2. Exact Match against Defined Aliases
  for (const route of VOICE_ROUTES) {
    for (const alias of route.aliases) {
      const normAlias = normalizeVoiceTranscript(alias);
      if (normalized === normAlias) {
        return {
          matched: true,
          intent: 'NAVIGATE',
          targetRoute: route.path,
          targetLabel: route.label,
          confidence: 1.0,
          rawTranscript,
          normalizedTranscript: normalized,
          matchedKeyword: alias,
        };
      }
    }
  }

  // 3. Keyword / Substring Match with Scoring
  let bestMatch: { route: VoiceRouteDefinition; score: number; keyword: string } | null = null;

  // Clean filler words to test core destination noun
  const stripped = normalized
    .replace(/^(open|go to|take me to|navigate to|show|view|switch to|display|launch|load|i want to see|please open|please go to)\s+/i, '')
    .trim();

  for (const route of VOICE_ROUTES) {
    for (const kw of route.keywords) {
      const normKw = normalizeVoiceTranscript(kw);

      // Exact match on stripped command (e.g. user said "open map" -> stripped is "map")
      if (stripped === normKw) {
        return {
          matched: true,
          intent: 'NAVIGATE',
          targetRoute: route.path,
          targetLabel: route.label,
          confidence: 0.95,
          rawTranscript,
          normalizedTranscript: normalized,
          matchedKeyword: kw,
        };
      }

      // Word boundary match in full transcript
      const regex = new RegExp(`\\b${normKw}\\b`, 'i');
      if (regex.test(normalized)) {
        const score = normKw.length / normalized.length;
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
      normalizedTranscript: normalized,
      matchedKeyword: bestMatch.keyword,
    };
  }

  // 4. No Command Recognized
  return {
    matched: false,
    intent: 'UNKNOWN',
    confidence: 0,
    rawTranscript,
    normalizedTranscript: normalized,
  };
}
