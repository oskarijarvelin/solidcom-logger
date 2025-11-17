# Intercom Logger

A real-time voice-to-text transcription application built with Next.js. Perfect for logging conversations, meetings, or any spoken content with automatic speech recognition.

## Features

- **Multiple Transcription Services** - Choose between:
  - Web Speech API (Browser-based, free)
  - OpenAI GPT-4o (High-quality AI transcription, requires API key)
  - Mistral AI Voxtral-mini (Fast and efficient, requires API key)
  - Eleven Labs Scribe (High-quality speech-to-text, requires API key)
  - **NEW:** Eleven Labs Scribe v2 Real-time Streaming (WebSocket-based, ultra-low latency, requires API key)
- **Real-time Speech Recognition** - Automatic voice transcription
- **WebSocket Streaming** - Ultra-low latency transcription with Eleven Labs scribe_v2_realtime
- **Message Log** - All transcribed messages saved with timestamps in reverse chronological order
- **Keyword Highlighting** - Highlight important keywords with custom colors
- **Multilingual Support** - Built-in support for English and Finnish
- **Dark Mode** - Toggle between light and dark themes
- **Customizable Font Sizes** - Choose from small, medium, or large text sizes
- **Audio Device Selection** - Select your preferred microphone input
- **Auto-restart** - Robust error handling keeps transcription running smoothly (Web Speech API)
- **Export Functionality** - Download message logs as JSON or PDF
- **Responsive Design** - Works on desktop and mobile devices

## Table of Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Self-Hosting on Vercel](#self-hosting-on-vercel)
- [Usage Guide](#usage-guide)
- [Contributing](#contributing)
- [Technology Stack](#technology-stack)
- [Browser Compatibility](#browser-compatibility)
- [License](#license)

## Requirements

### System Requirements
- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)

### Browser Requirements
- **Chrome/Edge** (recommended) - Full support for all transcription services
- **Safari** - Partial support for Web Speech API
- **Firefox** - Not supported for Web Speech API (use OpenAI or Mistral transcription services instead)

### API Keys (Optional)
- **OpenAI API Key** - Required only if using OpenAI GPT-4o transcription
  - Get your key from: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Mistral AI API Key** - Required only if using Mistral AI Voxtral-mini transcription
  - Get your key from: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys/)
- **Eleven Labs API Key** - Required only if using Eleven Labs Scribe transcription or Real-time Streaming
  - Get your key from: [elevenlabs.io](https://elevenlabs.io/app/speech-synthesis/text-to-speech)

## Getting Started

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/oskarijarvelin/intercom-logger.git
   cd intercom-logger
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Configure API keys:**
   If you want to use OpenAI, Mistral AI, or Eleven Labs transcription services, create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your API keys:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key_here
   NEXT_PUBLIC_MISTRAL_API_KEY=your_mistral_key_here
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key_here
   ```
   
   **Note:** You can also configure API keys directly in the application settings (they will be stored in your browser's local storage).

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

6. **Grant microphone permissions** when prompted by your browser

### Building for Production

```bash
npm run build
npm start
```

## Self-Hosting on Vercel

Vercel is the easiest way to deploy your Next.js application.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/oskarijarvelin/intercom-logger)

### Manual Deployment

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Vercel Dashboard Deployment

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure your project (Vercel auto-detects Next.js)
6. Click "Deploy"

Your application will be live at `https://your-project-name.vercel.app`

## Usage Guide

### Starting a Recording Session

1. Click the **"Start Recording"** button in the header
2. Allow microphone access if prompted
3. Begin speaking - your words will appear in real-time
4. Finalized transcriptions are saved to the message log with timestamps

### Configuring Settings

Click the **settings icon** (⚙️) in the header to access:

- **Language** - Choose English or Finnish
- **Transcription Service** - Select between:
  - **Web Speech API** - Free browser-based transcription (works offline, Chrome/Edge recommended)
  - **OpenAI GPT-4o** - High-quality AI transcription (requires API key, works in all browsers)
  - **Mistral AI Voxtral-mini** - Fast and efficient transcription (requires API key, works in all browsers)
  - **Eleven Labs Scribe** - High-quality speech-to-text (requires API key, works in all browsers)
- **API Keys** - Enter your OpenAI, Mistral AI, or Eleven Labs API key when using those services
- **Theme** - Switch between light and dark modes
- **Font Size** - Adjust text size for better readability
- **Audio Input Device** - Select your preferred microphone
- **Keyword Highlighting** - Add keywords with custom colors to highlight in transcriptions
- **Download Message Log** - Export your transcription history

### Keyword Highlighting

1. Open Settings
2. Enter a keyword in the "Keyword" field
3. Select a highlight color
4. Click "Add Keyword"
5. The keyword will be highlighted whenever it appears in transcriptions

### Downloading Message Logs

1. Open Settings
2. Scroll to the "Download Message Log" section
3. Choose format:
   - **JSON** - Machine-readable format with all metadata
   - **PDF** - Human-readable document for printing/sharing
4. Click the download button

### Using Eleven Labs Real-time Streaming

For ultra-low latency transcription, use the dedicated Eleven Labs streaming page:

1. Click the **"EL Stream"** button in the header (purple button with lightning icon)
2. You'll be taken to the Eleven Labs Streaming page
3. Make sure you have configured your Eleven Labs API key in the main settings
4. Click **"Start Streaming"** to begin real-time transcription
5. Allow microphone access if prompted
6. Speak naturally - transcriptions appear with minimal delay
7. The connection status indicator shows:
   - **Green dot** - Connected and streaming
   - **Yellow dot** - Connecting
   - **Red dot** - Error
   - **Gray dot** - Disconnected
8. Click **"Stop Streaming"** to end the session
9. Click **"Back to Home"** to return to the main page

**Benefits of Real-time Streaming:**
- Lower latency compared to chunked audio transcription
- Continuous WebSocket connection for instant results
- Interim results show what's being transcribed in real-time
- Optimized audio processing (16kHz mono PCM)
4. Click the download button

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/intercom-logger.git
   cd intercom-logger
   ```

3. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Make your changes and test thoroughly

6. Run linting:
   ```bash
   npm run lint
   ```

7. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

8. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

9. Open a Pull Request on GitHub

### Contribution Guidelines

- Write clear, descriptive commit messages
- Follow the existing code style
- Test your changes in Chrome/Edge and Safari
- Update documentation if needed
- Keep changes focused and atomic

### Areas for Contribution

- Adding support for more languages
- Improving PDF export formatting
- Enhancing accessibility
- Bug fixes and performance improvements
- Documentation improvements

## Technology Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)** - Browser-native speech recognition
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** - Audio processing for real-time streaming
- **[WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)** - Real-time bidirectional communication
- **[OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)** - GPT-4o based transcription
- **[Mistral AI API](https://docs.mistral.ai/)** - Voxtral-mini transcription service
- **[Eleven Labs API](https://elevenlabs.io/docs)** - Scribe speech-to-text service and scribe_v2_realtime streaming
- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF generation (for export)

## Browser Compatibility

| Browser | Web Speech API | OpenAI/Mistral/Eleven Labs | Notes |
|---------|----------------|----------------------------|-------|
| Chrome | ✅ Full | ✅ Full | Recommended for Web Speech API |
| Edge | ✅ Full | ✅ Full | Recommended for Web Speech API |
| Safari | ⚠️ Partial | ✅ Full | Limited Web Speech API, use API services for best results |
| Firefox | ❌ None | ✅ Full | Use OpenAI, Mistral, or Eleven Labs transcription services |
| Opera | ✅ Full | ✅ Full | Chromium-based |

## License

This project is open source and available under the MIT License.

## Author

Created by [Oskari Järvelin](https://oskarijarvelin.fi)

---

**Need help?** Open an issue on [GitHub](https://github.com/oskarijarvelin/intercom-logger/issues)



