"use client";
// Import necessary modules and components
import { useEffect, useState, useRef } from "react";

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
};

// Export the MicrophoneComponent function component
export default function MicrophoneComponent() {
  // State variables to manage transcription status and text
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionComplete, setTranscriptionComplete] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [messageLog, setMessageLog] = useState<MessageLogEntry[]>([]);

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

  // Predefined commands
  const commands: Commands = {
    "hello": () => alert("Hello!"),
    "open google": () => window.open("https://www.google.com", "_blank")
    // Add more commands as needed
  };

  // Function to start transcription
  const startTranscription = () => {
    setIsTranscribing(true);
    shouldTranscribeRef.current = true;
    // Create a new SpeechRecognition instance and configure it
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.lang = "fi";
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
        const timestamp = formatTimestamp(new Date());
        setMessageLog(prev => [{ text: transcript, timestamp }, ...prev]);
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

  // Render the microphone component with appropriate UI based on transcription state
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="w-full">
        {(isTranscribing || transcriptionText) && (
          <div className="w-1/4 m-auto rounded-md border p-4 bg-white">
            <div className="flex-1 flex w-full justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {transcriptionComplete ? "Transcription Complete" : "Transcribing"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transcriptionComplete
                    ? "Thanks for speaking."
                    : "Speak now..."}
                </p>
              </div>
              {isTranscribing && (
                <div className="rounded-full w-4 h-4 bg-red-400 animate-pulse" />
              )}
            </div>

            {transcriptionText && (
              <div className="border rounded-md p-2 h-fullm mt-4">
                <p className="mb-0">{transcriptionText}</p>
              </div>
            )}
          </div>
        )}

        {/* Message Log Display */}
        {messageLog.length > 0 && (
          <div className="w-1/2 m-auto rounded-md border p-4 bg-white mt-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3">Message Log</h3>
            <div className="space-y-2">
              {messageLog.map((entry, index) => (
                <div key={index} className="border-b pb-2 last:border-b-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm flex-1">{entry.text}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{entry.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center w-full">
          {isTranscribing ? (
            // Button for stopping transcription
            <button
              onClick={handleToggleTranscription}
              className="mt-10 m-auto flex items-center justify-center bg-red-400 hover:bg-red-500 rounded-full w-20 h-20 focus:outline-none"
            >
              <svg
                className="h-12 w-12 "
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
          ) : (
            // Button for starting transcription
            <button
              onClick={handleToggleTranscription}
              className="mt-10 m-auto flex items-center justify-center bg-blue-400 hover:bg-blue-500 rounded-full w-20 h-20 focus:outline-none"
            >
              <svg
                viewBox="0 0 256 256"
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-white"
              >
                <path
                  fill="currentColor" // Change fill color to the desired color
                  d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
