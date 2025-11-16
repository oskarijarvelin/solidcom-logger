"use client";
// Import necessary modules and components
import { useEffect, useState, useRef } from "react";
import { useSettings } from "@/lib/SettingsContext";
import Header from "../components/Header";
import SettingsModal from "../components/SettingsModal";

// Declare a global interface to add the webkitSpeechRecognition property to the Window object
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// Define the type for the commands object
type CommandFunction = () => void;
type Commands = {
  [key: string]: CommandFunction;
};

// Define the type for message log entries
type MessageLogEntry = {
  text: string;
  timestamp: string;
  createdAt: Date;
};

// Export the MicrophoneComponent function component
export default function MicrophoneComponent() {
  // Settings context
  const { language, fontSize, keywords, audioInputDeviceId, t } = useSettings();
  
  // State variables to manage transcription status and text
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionComplete, setTranscriptionComplete] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [messageLog, setMessageLog] = useState<MessageLogEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
  const [showFirefoxWarning, setShowFirefoxWarning] = useState(true);

  // Reference to store the SpeechRecognition instance
  const recognitionRef = useRef<any>(null);
  // Reference to track if we should be transcribing (for auto-restart logic)
  const shouldTranscribeRef = useRef(false);

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

  // Predefined commands
  const commands: Commands = {
    "rickroll": () => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank")
    // Add more commands as needed
  };

  // Function to start transcription
  const startTranscription = async () => {
    setIsTranscribing(true);
    shouldTranscribeRef.current = true;
    
    // Request permission for the selected audio device
    // This ensures the browser uses the correct microphone for speech recognition
    try {
      const constraints: MediaStreamConstraints = {
        audio: audioInputDeviceId ? { deviceId: { exact: audioInputDeviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop the stream immediately as we only needed to set the active device
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error accessing audio device:', error);
      // Continue anyway with default device
    }
    
    // Create a new SpeechRecognition instance and configure it
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    // Set language based on user settings
    recognitionRef.current.lang = language === "fi" ? "fi-FI" : "en-US";
    recognitionRef.current.interimResults = true;

    // Event handler for speech recognition results
    recognitionRef.current.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const { transcript } = lastResult[0];
      const isFinal = lastResult.isFinal;

      // Log the recognition results and update the transcript state
      //console.log(event.results);
      setTranscriptionText(transcript);

      // If the result is final, add it to the message log (newest first)
      if (isFinal && transcript.trim()) {
        const now = new Date();
        const timestamp = formatTimestamp(now);
        setMessageLog(prev => [{ text: transcript, timestamp, createdAt: now }, ...prev]);
      }

      // Check for predefined commands
      for (const command in commands) {
        if (transcript.toLowerCase().includes(command)) {
          commands[command]();
          break;
        }
      }
    };

    // Event handler for errors to prevent freezing
    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      // Auto-restart on certain errors if still transcribing
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
        console.log('Attempting to restart recognition due to:', event.error);
        setTimeout(() => {
          if (recognitionRef.current && shouldTranscribeRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 100);
      }
    };

    // Event handler for when recognition ends unexpectedly
    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      // Auto-restart if we're still supposed to be transcribing
      if (shouldTranscribeRef.current && recognitionRef.current) {
        console.log('Auto-restarting recognition...');
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }, 100);
      }
    };

    // Start the speech recognition
    recognitionRef.current.start();
  };

  // Cleanup effect when the component unmounts
  useEffect(() => {
    return () => {
      // Stop the speech recognition if it's active
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Detect Firefox browser
  useEffect(() => {
    const isFirefoxBrowser = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
    setIsFirefox(isFirefoxBrowser);
  }, []);

  // Effect to update relative time every second
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render by updating a state that doesn't affect display
      // This will cause getRelativeTime to be recalculated for all messages
      if (messageLog.length > 0) {
        setMessageLog(prev => [...prev]); // Trigger re-render without changing data
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [messageLog.length]);

  // Function to stop transcription
  const stopTranscription = () => {
    if (recognitionRef.current) {
      // Disable auto-restart before stopping
      shouldTranscribeRef.current = false;
      // Stop the speech recognition and mark transcription as complete
      recognitionRef.current.stop();
      setTranscriptionComplete(true);
    }
  };

  // Toggle transcription state and manage transcription actions
  const handleToggleTranscription = () => {
    setIsTranscribing(!isTranscribing);
    if (!isTranscribing) {
      startTranscription();
    } else {
      stopTranscription();
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

  // Render the microphone component with appropriate UI based on transcription state
  return (
    <>
      <Header 
        isTranscribing={isTranscribing}
        onToggleTranscription={handleToggleTranscription}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        messageLog={messageLog}
      />

      <div className="flex flex-col h-screen w-full pt-16">
        <div className="w-full px-4 flex-1 flex flex-col">
          {/* Firefox Warning */}
          {isFirefox && showFirefoxWarning && (
            <div className="w-full md:max-w-7xl m-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 my-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                      {t("firefoxWarningShort")}
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {t("firefoxWarning")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFirefoxWarning(false)}
                  className="p-1 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors flex-shrink-0"
                  aria-label="Close warning"
                >
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Message Log Display */}
          {messageLog.length > 0 && (
            <div className="w-full md:max-w-7xl m-auto rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 my-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px - 2rem)' }}>
              <h3 className={`font-md font-semibold mb-3 text-gray-900 dark:text-white`}>
                {t("messageLog")}
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

        </div>
      </div>
    </>
  );
}
