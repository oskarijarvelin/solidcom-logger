// Transcription service interfaces and implementations

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
}

export interface TranscriptionService {
  start(language: string, onResult: (result: TranscriptionResult) => void, onError: (error: any) => void): void;
  stop(): void;
  isSupported(): boolean;
}

// Web Speech API Implementation
export class WebSpeechTranscriptionService implements TranscriptionService {
  private recognition: any = null;
  private shouldTranscribe = false;
  private restartTimeout: NodeJS.Timeout | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  start(language: string, onResult: (result: TranscriptionResult) => void, onError: (error: any) => void): void {
    if (!this.isSupported()) {
      onError(new Error('Web Speech API is not supported in this browser'));
      return;
    }

    this.shouldTranscribe = true;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = language === "fi" ? "fi-FI" : "en-US";
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const { transcript } = lastResult[0];
      const isFinal = lastResult.isFinal;

      onResult({ text: transcript, isFinal });
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Auto-restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture' || 
          event.error === 'network' || event.error === 'aborted') {
        if (this.restartTimeout) {
          clearTimeout(this.restartTimeout);
        }
        this.restartTimeout = setTimeout(() => {
          if (this.recognition && this.shouldTranscribe) {
            try {
              this.recognition.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
              onError(e);
            }
          }
        }, 1000);
      } else {
        onError(event);
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      // Auto-restart if we're still supposed to be transcribing
      if (this.shouldTranscribe && this.recognition) {
        if (this.restartTimeout) {
          clearTimeout(this.restartTimeout);
        }
        this.restartTimeout = setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            onError(e);
          }
        }, 1000);
      }
    };

    this.recognition.start();
  }

  stop(): void {
    this.shouldTranscribe = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }
}

// OpenAI GPT-4o Transcription Service
export class OpenAITranscriptionService implements TranscriptionService {
  private apiKey: string;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private recordingInterval: NodeJS.Timeout | null = null;
  private onResultCallback: ((result: TranscriptionResult) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private language: string = "en";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator &&
           this.apiKey.length > 0;
  }

  async start(language: string, onResult: (result: TranscriptionResult) => void, onError: (error: any) => void): Promise<void> {
    if (!this.isSupported()) {
      onError(new Error('OpenAI transcription is not supported or API key is missing'));
      return;
    }

    this.language = language;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isRecording = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0 && this.isRecording) {
          await this.transcribeAudio();
        }
      };

      // Record in 5-second chunks for near real-time transcription
      this.mediaRecorder.start();
      this.recordingInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          this.mediaRecorder.start();
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting OpenAI transcription:', error);
      onError(error);
    }
  }

  private async transcribeAudio(): Promise<void> {
    if (!this.onResultCallback || !this.onErrorCallback) return;

    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];

      // Convert to format acceptable by OpenAI (mp3, mp4, mpeg, mpga, m4a, wav, or webm)
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', this.language === 'fi' ? 'fi' : 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.text && data.text.trim()) {
        this.onResultCallback({ text: data.text.trim(), isFinal: true });
      }
    } catch (error) {
      console.error('Error transcribing with OpenAI:', error);
      this.onErrorCallback?.(error);
    }
  }

  stop(): void {
    this.isRecording = false;
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
    }

    this.audioChunks = [];
    this.onResultCallback = null;
    this.onErrorCallback = null;
  }
}

// Mistral AI Voxtral-mini Transcription Service
export class MistralTranscriptionService implements TranscriptionService {
  private apiKey: string;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private recordingInterval: NodeJS.Timeout | null = null;
  private onResultCallback: ((result: TranscriptionResult) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private language: string = "en";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator &&
           this.apiKey.length > 0;
  }

  async start(language: string, onResult: (result: TranscriptionResult) => void, onError: (error: any) => void): Promise<void> {
    if (!this.isSupported()) {
      onError(new Error('Mistral transcription is not supported or API key is missing'));
      return;
    }

    this.language = language;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isRecording = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0 && this.isRecording) {
          await this.transcribeAudio();
        }
      };

      // Record in 5-second chunks for near real-time transcription
      this.mediaRecorder.start();
      this.recordingInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          this.mediaRecorder.start();
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting Mistral transcription:', error);
      onError(error);
    }
  }

  private async transcribeAudio(): Promise<void> {
    if (!this.onResultCallback || !this.onErrorCallback) return;

    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'voxtral-mini');
      if (this.language === 'fi') {
        formData.append('language', 'fi');
      }

      const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Mistral API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.text && data.text.trim()) {
        this.onResultCallback({ text: data.text.trim(), isFinal: true });
      }
    } catch (error) {
      console.error('Error transcribing with Mistral:', error);
      this.onErrorCallback?.(error);
    }
  }

  stop(): void {
    this.isRecording = false;
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
    }

    this.audioChunks = [];
    this.onResultCallback = null;
    this.onErrorCallback = null;
  }
}

// Factory function to create transcription service
export function createTranscriptionService(
  type: 'webspeech' | 'openai' | 'mistral',
  apiKey?: string
): TranscriptionService {
  switch (type) {
    case 'webspeech':
      return new WebSpeechTranscriptionService();
    case 'openai':
      return new OpenAITranscriptionService(apiKey || '');
    case 'mistral':
      return new MistralTranscriptionService(apiKey || '');
    default:
      return new WebSpeechTranscriptionService();
  }
}
