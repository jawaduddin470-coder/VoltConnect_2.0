import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { voltAIService } from '@/services/voltAIService';
import { chargingDataService } from '@/services/chargingDataService';
import { VoltAIResponse, ChargingStation } from '@/types';
import {
  Sparkles,
  Send,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
  Compass,
  Navigation,
  Activity,
  Wrench,
  Car,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Info,
  DollarSign,
  MapPin,
  Battery,
  Mic,
  MicOff,
} from 'lucide-react';

interface CopilotCard {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  type?: 'charger' | 'trip' | 'health' | 'care';
  metrics?: { label: string; value: string }[];
  actionLabel?: string;
  actionRoute?: string;
}

export const VoltAIPage: React.FC = () => {
  const { user, activeVehicle } = useAuth();
  const navigate = useNavigate();

  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const [cards, setCards] = useState<CopilotCard[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Welcome ${user?.name || 'Driver'}! I am VoltAI, your contextual EV Copilot. Connected to your ${
        activeVehicle ? `${activeVehicle.manufacturer} ${activeVehicle.model} (${activeVehicle.batteryCapacitykWh} kWh, ${activeVehicle.currentBatteryPercent || 85}% SOC, ${activeVehicle.connectorTypes.join(', ')})` : 'active EV'
      }. Select an example query below or ask any question.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    chargingDataService.getStations().then(setStations);
  }, []);

  // Synchronize initial greeting text when authenticated user & vehicle context resolves
  useEffect(() => {
    if (user || activeVehicle) {
      setCards(prev => {
        if (prev.length > 0 && prev[0].id === 'init-1') {
          return [
            {
              ...prev[0],
              text: `Welcome ${user?.name || 'Driver'}! I am VoltAI, your contextual EV Copilot. Connected to your ${
                activeVehicle
                  ? `${activeVehicle.manufacturer} ${activeVehicle.model} (${activeVehicle.batteryCapacitykWh} kWh, ${activeVehicle.currentBatteryPercent || 85}% SOC, ${activeVehicle.connectorTypes.join(', ')})`
                  : 'active EV'
              }. Select an example query below or ask any question.`,
            },
            ...prev.slice(1),
          ];
        }
        return prev;
      });
    }
  }, [user, activeVehicle]);

  const handleQuery = async (queryText: string, typeHint?: 'charger' | 'trip' | 'health' | 'care') => {
    if (!queryText.trim()) return;

    const userCard: CopilotCard = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCards(prev => [...prev, userCard]);
    setInputQuery('');
    setIsThinking(true);

    const context = {
      userProfile: user,
      activeVehicle,
      currentSOC: activeVehicle?.currentBatteryPercent || 85,
      usableCapacitykWh: activeVehicle?.usableCapacitykWh || Math.round((activeVehicle?.batteryCapacitykWh || 45) * 0.95),
      estimatedRangeKm: activeVehicle?.estimatedRangeKm || 315,
      storedMaintenanceCount: 1,
      storedServiceRequestsCount: 0,
    };

    const aiRes = await voltAIService.processQuery(queryText, context, stations);
    setIsThinking(false);

    let route = '/explore';
    if (aiRes.suggestedAction?.type === 'OPEN_TRIP_PLANNER') route = '/trips';
    if (aiRes.suggestedAction?.type === 'OPEN_VOLTHEALTH') route = '/health';
    if (aiRes.suggestedAction?.type === 'CREATE_SERVICE_REQUEST') route = '/care';

    setCards(prev => [
      ...prev,
      {
        id: aiRes.id,
        sender: 'ai',
        text: aiRes.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: typeHint || 'charger',
        metrics: aiRes.dataCard?.metrics,
        actionLabel: aiRes.suggestedAction?.label || 'VIEW DETAILS',
        actionRoute: route,
      },
    ]);
  };

  const handleResetConversation = () => {
    setCards([
      {
        id: `init-${Date.now()}`,
        sender: 'ai',
        text: `Conversation reset. VoltAI context active for ${
          activeVehicle ? `${activeVehicle.manufacturer} ${activeVehicle.model}` : 'your EV'
        }. How can I assist you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto vc-page-enter">
      
      {/* 1. COPILOT HERO HEADER */}
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden vc-trans-voltai">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-teal text-[10px] uppercase font-bold">CONTEXTUAL EV ASSISTANT</span>
            {activeVehicle && (
              <span className="vc-badge vc-badge-navy text-[10px] uppercase font-extrabold text-sky-400 border-sky-500/30">
                CONTEXT: {activeVehicle.manufacturer} {activeVehicle.model} ({activeVehicle.currentBatteryPercent || 85}% SOC)
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-sky-400" /> VOLT AI ASSISTANT
          </h1>

          <p className="text-xs sm:text-sm text-slate-300">
            Contextual EV assistant using real application data from VoltMap, active EV profile, VoltTrip, and VoltHealth.
          </p>
        </div>

        <button
          onClick={handleResetConversation}
          className="vc-btn vc-btn-secondary-dark py-2.5 px-4 text-xs font-bold shrink-0 self-start md:self-auto flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Context
        </button>
      </div>

      {/* 2. ACTIVE EV CONTEXT BANNER */}
      {activeVehicle && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-teal-600" />
            <span className="font-extrabold text-navy-900">{activeVehicle.manufacturer} {activeVehicle.model}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-semibold">{activeVehicle.batteryCapacitykWh} kWh Pack</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 font-extrabold">{activeVehicle.currentBatteryPercent || 85}% SOC</span>
            <span className="text-slate-400">•</span>
            <span className="text-sky-600 font-bold">{activeVehicle.connectorTypes.join(', ')} Ports</span>
          </div>

          <span className="vc-badge vc-badge-teal text-[9px] uppercase font-bold">APPLICATION DATA CONNECTED</span>
        </div>
      )}

      {/* 3. CONTEXTUAL PROMPTS MATRIX (REQUIRED EXAMPLE QUERIES) */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold text-navy-900 uppercase tracking-wider">
          Example Contextual Prompts
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          <button
            onClick={() => handleQuery('Where should I charge?', 'charger')}
            className="vc-card p-4 bg-white border border-slate-200 hover:border-sky-500 text-left space-y-2 group transition-all"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-500" />
              <span className="font-extrabold text-xs text-navy-900 group-hover:text-sky-600">"Where should I charge?"</span>
            </div>
            <p className="text-[11px] text-slate-500">Finds best matching compatible station on VoltMap.</p>
          </button>

          <button
            onClick={() => handleQuery('Can I reach Vijayawada?', 'trip')}
            className="vc-card p-4 bg-white border border-slate-200 hover:border-teal-500 text-left space-y-2 group transition-all"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-teal-500" />
              <span className="font-extrabold text-xs text-navy-900 group-hover:text-teal-600">"Can I reach Vijayawada?"</span>
            </div>
            <p className="text-[11px] text-slate-500">Calculates 275 km energy physics & arrival SOC %.</p>
          </button>

          <button
            onClick={() => handleQuery('How is my battery health?', 'health')}
            className="vc-card p-4 bg-white border border-slate-200 hover:border-emerald-500 text-left space-y-2 group transition-all"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="font-extrabold text-xs text-navy-900 group-hover:text-emerald-600">"How is my battery health?"</span>
            </div>
            <p className="text-[11px] text-slate-500">Retrieves VoltHealth modelled SOH % & capacity.</p>
          </button>

          <button
            onClick={() => handleQuery('What is the cheapest compatible charger nearby?', 'charger')}
            className="vc-card p-4 bg-white border border-slate-200 hover:border-amber-500 text-left space-y-2 group transition-all"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span className="font-extrabold text-xs text-navy-900 group-hover:text-amber-600">"Cheapest compatible charger?"</span>
            </div>
            <p className="text-[11px] text-slate-500">Ranks matching stations by lowest ₹/kWh tariff.</p>
          </button>

          <button
            onClick={() => handleQuery('Plan a trip to Vijayawada.', 'trip')}
            className="vc-card p-4 bg-white border border-slate-200 hover:border-indigo-500 text-left space-y-2 group transition-all"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span className="font-extrabold text-xs text-navy-900 group-hover:text-indigo-600">"Plan a trip to Vijayawada."</span>
            </div>
            <p className="text-[11px] text-slate-500">Generates charging stop plan & opens VoltTrip.</p>
          </button>

        </div>
      </div>

      {/* 4. CHAT HISTORY DISPLAY AREA */}
      <div className="vc-card p-6 bg-white border border-slate-200 rounded-3xl space-y-6 shadow-xs min-h-[380px]">
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {cards.map(card => (
            <div
              key={card.id}
              className={`flex gap-3 text-xs ${card.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {card.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-sky-400 flex items-center justify-center shrink-0 border border-slate-800">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-xl space-y-2 shadow-xs ${
                  card.sender === 'user'
                    ? 'bg-slate-900 text-white font-semibold rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 gap-4">
                  <span className="font-extrabold uppercase">{card.sender === 'user' ? 'You' : 'VoltAI Copilot'}</span>
                  <span>{card.timestamp}</span>
                </div>

                <p className="leading-relaxed whitespace-pre-line text-xs">{card.text}</p>

                {/* Structured Data Card Output */}
                {card.metrics && (
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {card.metrics.map(m => (
                      <div key={m.label} className="p-2 rounded-xl bg-white border border-slate-200 text-[11px]">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">{m.label}</span>
                        <span className="font-extrabold text-navy-900">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Direct Action Link */}
                {card.actionRoute && (
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(card.actionRoute!)}
                      className="vc-btn vc-btn-teal py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <span>{card.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-sky-600 font-bold p-3 bg-sky-50 rounded-2xl max-w-xs animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-sky-500" />
              <span>VoltAI retrieving application data...</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. INPUT CHAT TOOLBAR */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleQuery(inputQuery);
        }}
        className="flex items-center gap-2 sm:gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-md"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          placeholder="Ask VoltAI: 'Where should I charge?' or 'Can I reach Vijayawada?'..."
          className="flex-1 px-4 py-2.5 text-xs font-semibold text-navy-900 focus:outline-none bg-transparent"
        />

        {/* Voice Dictation Button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window === 'undefined') return;
            const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechAPI) {
              alert('Speech recognition is not supported in this browser.');
              return;
            }
            try {
              const rec = new SpeechAPI();
              rec.lang = 'en-US';
              rec.interimResults = false;
              rec.maxAlternatives = 1;
              rec.onresult = (evt: any) => {
                const text = evt.results?.[0]?.[0]?.transcript || '';
                if (text) {
                  setInputQuery(text);
                  handleQuery(text);
                }
              };
              rec.start();
            } catch (err) {
              console.warn('[VoltAI Voice] Voice dictation start error:', err);
            }
          }}
          className="p-2.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 transition-colors"
          title="Voice Ask"
        >
          <Mic className="w-4 h-4" />
        </button>

        <button
          type="submit"
          disabled={!inputQuery.trim() || isThinking}
          className="vc-btn vc-btn-teal py-2.5 px-5 text-xs font-extrabold flex items-center gap-1.5 shadow-md disabled:opacity-50 shrink-0"
        >
          <span>ASK</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};
