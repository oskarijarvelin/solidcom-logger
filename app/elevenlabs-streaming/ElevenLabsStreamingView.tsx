"use client";
import { useEffect, useState, useRef } from "react";
import { useSettings } from "@/lib/SettingsContext";

// Define the type for message log entries
type MessageLogEntry = {
  text: string;
  timestamp: string;
  createdAt: Date;
};

export default function ElevenLabsStreamingView() {
  const { language, fontSize, keywords, elevenlabsApiKey, t } = useSettings();
  
  // State variables
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [messageLog, setMessageLog] = useState<MessageLogEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // References
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Helper function to format timestamp
  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Helper function to get relative time
  const getRelativeTime = (createdAt: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffSeconds < 60) {
      return diffSeconds <= 1 ? t("justNow") : `${diffSeconds} ${t("secondsAgo")}`;
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? t("oneMinuteAgo") : `${diffMinutes} ${t("minutesAgo")}`;
    } else {
      return diffHours === 1 ? t("oneHourAgo") : `${diffHours} ${t("hoursAgo")}`;
    }
  };

  // Convert Float32Array to 16-bit PCM
  const float32To16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // Start streaming
  const startStreaming = async () => {
    const apiKey = elevenlabsApiKey || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
    if (!apiKey) {
      setErrorMessage(t("apiKeyRequired") || "API key is required");
      return;
    }

    try {
      setConnectionStatus('connecting');
      setErrorMessage("");
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      mediaStreamRef.current = stream;

      // Create WebSocket connection
      const languageCode = language === "fi" ? "fi" : "en";
      const wsUrl = `wss://api.elevenlabs.io/v1/scribe_v2_realtime?language=${languageCode}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // WebSocket event handlers
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setIsStreaming(true);
        
        // Send authentication message
        ws.send(JSON.stringify({
          type: 'authentication',
          api_key: apiKey
        }));

        // Set up audio processing
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = float32To16BitPCM(inputData);
            
            // Send audio data as binary
            ws.send(pcmData.buffer);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcription') {
            if (data.is_final) {
              // Final transcription
              if (data.text && data.text.trim()) {
                const now = new Date();
                const timestamp = formatTimestamp(now);
                setMessageLog(prev => [{ text: data.text.trim(), timestamp, createdAt: now }, ...prev]);
                setTranscriptionText("");
              }
            } else {
              // Interim transcription
              setTranscriptionText(data.text || "");
            }
          } else if (data.type === 'error') {
            console.error('Transcription error:', data.message);
            setErrorMessage(data.message || 'Transcription error occurred');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setErrorMessage('Connection error occurred');
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setConnectionStatus('disconnected');
        setIsStreaming(false);
        stopStreaming();
      };

    } catch (error) {
      console.error('Error starting stream:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start streaming');
      setIsStreaming(false);
    }
  };

  // Stop streaming
  const stopStreaming = () => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setIsStreaming(false);
    setConnectionStatus('disconnected');
    setTranscriptionText("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  // Toggle streaming
  const handleToggleStreaming = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  // Function to highlight keywords in text
  const highlightKeywords = (text: string) => {
    if (keywords.length === 0) {
      return <span>{text}</span>;
    }

    let highlightedText: (string | JSX.Element)[] = [text];

    keywords.forEach((kw, kwIndex) => {
      const newHighlightedText: (string | JSX.Element)[] = [];
      
      highlightedText.forEach((segment, segIndex) => {
        if (typeof segment === "string") {
          const parts = segment.split(new RegExp(`(${kw.keyword})`, "gi"));
          parts.forEach((part, partIndex) => {
            if (part.toLowerCase() === kw.keyword.toLowerCase()) {
              newHighlightedText.push(
                <span
                  key={`${kwIndex}-${segIndex}-${partIndex}`}
                  style={{
                    backgroundColor: kw.color,
                    color: kw.textColor,
                    padding: "2px 4px",
                    borderRadius: "3px",
                  }}
                >
                  {part}
                </span>
              );
            } else if (part) {
              newHighlightedText.push(part);
            }
          });
        } else {
          newHighlightedText.push(segment);
        }
      });
      
      highlightedText = newHighlightedText;
    });

    return <>{highlightedText}</>;
  };

  // Get font size class based on settings
  const getFontSizeClass = () => {
    switch (fontSize) {
      case "small":
        return "text";
      case "large":
        return "text-4xl";
      default:
        return "text-xl";
    }
  };

  // Get spacing class based on font size
  const getSpacingClass = () => {
    switch (fontSize) {
      case "small":
        return "space-y-2";
      case "large":
        return "space-y-4";
      default:
        return "space-y-2";
    }
  };

  // Get padding bottom class based on font size
  const getPaddingBottomClass = () => {
    switch (fontSize) {
      case "small":
        return "pb-2";
      case "large":
        return "pb-4";
      default:
        return "pb-2";
    }
  };

  // Get connection status color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Eleven Labs Streaming
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleStreaming}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isStreaming
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
            </button>
            
            <a
              href="/"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-screen w-full pt-16">
        <div className="w-full px-4 flex-1 flex flex-col">
          {/* Error Message */}
          {errorMessage && (
            <div className="w-full md:max-w-7xl m-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4 m-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                    Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Transcription (Interim Results) */}
          {transcriptionText && (
            <div className="w-full md:max-w-7xl m-auto rounded-md border border-blue-200 dark:border-blue-700 p-4 bg-blue-50 dark:bg-blue-900/20 my-4">
              <p className={`${getFontSizeClass()} text-gray-700 dark:text-gray-300 italic`}>
                {transcriptionText}
              </p>
            </div>
          )}
          
          {/* Message Log Display */}
          {messageLog.length > 0 && (
            <div className="w-full md:max-w-7xl m-auto rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 my-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px - 2rem)' }}>
              <h3 className={`font-md font-semibold mb-3 text-gray-900 dark:text-white`}>
                Transcription Log
              </h3>
              <div className={getSpacingClass()}>
                {messageLog.map((entry, index) => (
                  <div key={index} className={`border-b border-gray-200 dark:border-gray-700 ${getPaddingBottomClass()} last:border-b-0`}>
                    <div className="flex flex-col gap-2">
                      <span className={`text-xs text-gray-500 dark:text-gray-400`}>
                        {entry.timestamp} • {getRelativeTime(entry.createdAt)}
                      </span>
                      <p className={`${getFontSizeClass()} text-gray-900 dark:text-white`}>
                        {highlightKeywords(entry.text)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Panel when not streaming */}
          {!isStreaming && messageLog.length === 0 && (
            <div className="w-full md:max-w-7xl m-auto rounded-md border border-gray-200 dark:border-gray-700 p-8 bg-white dark:bg-gray-800 my-4 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Real-Time Speech to Text
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click "Start Streaming" to begin real-time transcription using Eleven Labs scribe_v2_realtime API.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Make sure you have configured your Eleven Labs API key in the settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
