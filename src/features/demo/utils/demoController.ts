export interface MSMEDemoStep {
  stepNumber: number;
  title: string;
  module: string;
  route: string;
  description: string;
  keyHighlights: string[];
}

export const MSME_DEMO_SEQUENCE: MSMEDemoStep[] = [
  {
    stepNumber: 1,
    title: 'Brand Experience & Value Proposition',
    module: 'Landing Page & Opening Transition',
    route: '/',
    description: 'Cinematic opening transition with Full Logo leading to startup-grade EV ecosystem value proposition.',
    keyHighlights: ['Light theme aesthetic', 'Subtle EV pattern', 'Clear CTA buttons'],
  },
  {
    stepNumber: 2,
    title: 'Driver Onboarding & EV Garage',
    module: 'Driver Platform & Vehicle Garage',
    route: '/garage',
    description: 'Multi-category EV setup (4-wheeler, 2-wheeler, commercial) with verified battery specs catalog.',
    keyHighlights: ['Usable kWh pack specs', 'Connector standards', 'Active vehicle selection'],
  },
  {
    stepNumber: 3,
    title: 'VoltMap Charging Network Intelligence',
    module: 'VoltMap Discovery',
    route: '/explore',
    description: 'Vehicle-aware charging discovery filtered by connector compatibility and signature VoltScore diagnostic ring.',
    keyHighlights: ['VoltScore (0-100)', 'Live port status', 'Distance reachability'],
  },
  {
    stepNumber: 4,
    title: 'Energy-Aware Journey Planning',
    module: 'Smart Trip Planner',
    route: '/trips',
    description: 'Calculates journey energy consumption, arrival SOC %, and optimal intermediate fast charging waypoints.',
    keyHighlights: ['Safety battery buffer', 'Charging stop duration', 'Total trip tariff'],
  },
  {
    stepNumber: 5,
    title: 'Battery Health & Maintenance Intelligence',
    module: 'VoltHealth & VoltCare',
    route: '/health',
    description: 'Modelled battery SOH tracking with explicit data confidence tags and progressive service request setup.',
    keyHighlights: ['Modelled SOH 98%', 'Data confidence tags', 'Service request state machine'],
  },
  {
    stepNumber: 6,
    title: 'Personalized EV Analytics & Copilot',
    module: 'VoltInsight & VoltAI',
    route: '/insight',
    description: 'Real-data analytics engine with transparent VoltScore factor breakdown and prompt-injection-protected VoltAI copilot.',
    keyHighlights: ['Wh/km efficiency', 'VoltScore 4-factor model', 'Prompt injection guard'],
  },
  {
    stepNumber: 7,
    title: 'B2B CPO Partner & Technician Workspace',
    module: 'Partner & Technician Portals',
    route: '/partner/dashboard',
    description: 'Partner station creation submitting to Admin review pipeline, and mobile-first field technician workload manager.',
    keyHighlights: ['CPO station submission', 'Live feed status indicator', 'Field task lifecycle'],
  },
  {
    stepNumber: 8,
    title: 'Admin Command Center Mission Control',
    module: 'Admin Command Center',
    route: '/admin/dashboard',
    description: 'Centralized operational governance, station verification queue, data quality alerts, and immutable audit logging.',
    keyHighlights: ['Station approval queue', 'Data quality center', 'Central audit trail'],
  },
];

class MSMEDemoController {
  getSteps(): MSMEDemoStep[] {
    return MSME_DEMO_SEQUENCE;
  }
}

export const msmeDemoController = new MSMEDemoController();
