import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveVoiceCommand, VoiceCommandMatch } from '@/services/voiceNavigationService';

export type VoiceNavigationStatus =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'INTENT_DETECTED'
  | 'EXECUTING'
  | 'NAVIGATING'
  | 'SUCCESS'
  | 'ERROR';

export interface UseVoiceNavigationReturn {
  isSupported: boolean;
  status: VoiceNavigationStatus;
  transcript: string;
  interimTranscript: string;
  lastMatch: VoiceCommandMatch | null;
  errorMessage: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetState: () => void;
}

export function useVoiceNavigation(): UseVoiceNavigationReturn {
  const navigate = useNavigate();

  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<VoiceNavigationStatus>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastMatch, setLastMatch] = useState<VoiceCommandMatch | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References to manage Safari / WebKit recognition lifecycle cleanly
  const recognitionRef = useRef<any>(null);
  const isExplicitStopRef = useRef(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptAccumulatorRef = useRef('');

  // Check browser Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSupport = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setIsSupported(hasSupport);
    }
  }, []);

  // Helper to clear pending auto-reset timers
  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  // Reset state back to IDLE / READY for next command
  const resetState = useCallback(() => {
    clearResetTimer();
    setStatus('IDLE');
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
    finalTranscriptAccumulatorRef.current = '';
    isExplicitStopRef.current = false;
  }, [clearResetTimer]);

  // Execute resolved voice command with proper state progression & feedback
  const executeCommand = useCallback(
    (commandText: string) => {
      const match = resolveVoiceCommand(commandText);
      setLastMatch(match);
      setTranscript(commandText);
      setInterimTranscript('');

      if (match.matched) {
        setStatus('INTENT_DETECTED');
        setErrorMessage(null);

        setTimeout(() => {
          setStatus('EXECUTING');

          setTimeout(() => {
            if (match.intent === 'GO_BACK') {
              navigate(-1);
            } else if (match.targetRoute) {
              navigate(match.targetRoute, { state: match.navigationState });
            }

            setStatus('SUCCESS');

            clearResetTimer();
            resetTimerRef.current = setTimeout(() => {
              resetState();
            }, 1800);
          }, 350);
        }, 300);
      } else {
        setStatus('ERROR');
        setErrorMessage(match.feedbackMessage || `Command "${commandText}" not recognized. Try "Plan a trip to Kolkata" or "Open Map".`);

        clearResetTimer();
        resetTimerRef.current = setTimeout(() => {
          resetState();
        }, 3000);
      }
    },
    [navigate, resetState, clearResetTimer]
  );

  // Stop current recognition session safely
  const stopListening = useCallback(() => {
    isExplicitStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      recognitionRef.current = null;
    }

    // If text was accumulated, process it; otherwise return to IDLE
    if (finalTranscriptAccumulatorRef.current.trim()) {
      setStatus('PROCESSING');
      executeCommand(finalTranscriptAccumulatorRef.current.trim());
    } else {
      resetState();
    }
  }, [executeCommand, resetState]);

  // Start a fresh recognition session with full Safari / WebKit lifecycle handling
  const startListening = useCallback(() => {
    clearResetTimer();

    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setStatus('ERROR');
      setErrorMessage('Voice recognition is not supported in this browser.');
      return;
    }

    // 1. Abort any existing active recognition instance before creating a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    // 2. Reset state variables
    isExplicitStopRef.current = false;
    finalTranscriptAccumulatorRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
    setLastMatch(null);

    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      // Configuration for optimal mobile & Safari responsiveness
      recognition.continuous = false; // Safari handles single-shot recognition with highest reliability
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setStatus('LISTENING');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          finalTranscriptAccumulatorRef.current = final;
          setTranscript(final);
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;

        // Ignore aborted errors if intentionally stopped by user
        if (errType === 'aborted' && isExplicitStopRef.current) {
          return;
        }

        if (errType === 'no-speech') {
          setStatus('ERROR');
          setErrorMessage('No speech detected. Please tap mic and speak clearly.');
        } else if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setStatus('ERROR');
          setErrorMessage('Microphone access denied. Please enable mic permissions in browser settings.');
        } else if (errType === 'network') {
          setStatus('ERROR');
          setErrorMessage('Speech recognition network error. Please check connection.');
        } else {
          setStatus('ERROR');
          setErrorMessage(`Voice error: ${errType || 'Unable to recognize audio'}`);
        }

        clearResetTimer();
        resetTimerRef.current = setTimeout(() => {
          resetState();
        }, 3000);
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        // If stopped with final speech accumulated, execute command
        const speechToProcess = finalTranscriptAccumulatorRef.current.trim();
        if (speechToProcess) {
          setStatus('PROCESSING');
          executeCommand(speechToProcess);
        } else if (!isExplicitStopRef.current && status === 'LISTENING') {
          // Session timed out with no speech
          setStatus('IDLE');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('[Voice Navigation] Failed to start speech recognition:', err);
      setStatus('ERROR');
      setErrorMessage(err?.message || 'Unable to access microphone.');
      clearResetTimer();
      resetTimerRef.current = setTimeout(() => {
        resetState();
      }, 3000);
    }
  }, [clearResetTimer, executeCommand, resetState, status]);

  // Toggle listening button
  const toggleListening = useCallback(() => {
    if (status === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearResetTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [clearResetTimer]);

  return {
    isSupported,
    status,
    transcript,
    interimTranscript,
    lastMatch,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    resetState,
  };
}
