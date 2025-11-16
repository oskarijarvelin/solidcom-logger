# Changes Summary

## 1. Mobile Chrome Duplicate Words Fix & Warning Banner

**What was the problem:**
On mobile Chrome, the Web Speech API sometimes sends cumulative transcripts where each final result includes previously spoken words. For example, it might send "Hello", then "Hello world", then "Hello world test" - each as a separate final result. The previous accumulation logic simply concatenated these, resulting in duplicate words like "Hello Hello world Hello world test".

**What changed:**
1. **Improved Duplicate Detection**: Enhanced the transcript accumulation logic to detect and handle cumulative transcripts from mobile Chrome. The system now checks if new transcripts contain previously accumulated text and extracts only the new portion to prevent duplicates.

2. **User Warning**: Added a dismissable warning banner specifically for mobile Chrome users to inform them that transcription may not work as expected and that some words might be duplicated or missed.

**How it works:**
1. When a final result is received, the system checks if it's cumulative (contains the accumulated text)
2. If the new transcript starts with the accumulated text, only the new part is extracted and appended
3. If the accumulated text is found elsewhere in the new transcript, it replaces the accumulated text to handle reordering
4. Otherwise, normal accumulation occurs
5. A dismissable warning banner appears for Android Chrome users, informing them about potential issues
6. The warning can be dismissed by clicking the X button and won't reappear during that session

**How to test:**
1. Open the application on an Android device with Chrome browser
2. Verify that an orange warning banner appears at the top saying "Mobile Chrome transcription may be unreliable"
3. Click the X button on the warning banner to dismiss it - it should disappear
4. Start recording and speak continuously: "Hello world this is a test"
5. Verify that words are not duplicated in the message log
6. On desktop Chrome, verify that the mobile warning does NOT appear

**Code changes:**
- `lib/translations.ts`: Added `mobileChromeWarning` and `mobileChromeWarningShort` translations for English and Finnish
- `app/views/HomeView.tsx`:
  - Lines 41-42: Added `isMobileChrome` and `showMobileChromeWarning` state variables
  - Lines 313-320: Added mobile Chrome browser detection using Android + Chrome user agent detection
  - Lines 169-212: Enhanced `onresult` handler with cumulative transcript detection logic
  - Lines 487-512: Added dismissable mobile Chrome warning banner in orange color scheme

## 2. Mobile Chrome Word-by-Word Message Fix (Previous Implementation)

**What was the problem:**
On mobile Chrome, the Web Speech API treats each word as a separate "final" result instead of grouping words into complete sentences. This caused the application to create a new message log entry for every single word spoken, making the message log cluttered and difficult to read.

**What changed:**
Implemented a debounce mechanism that accumulates speech transcripts and waits for a pause (1.5 seconds) before adding them to the message log. This groups words into complete sentences or phrases, providing a much better user experience on mobile devices.

**How it works:**
1. When a final result is received, it's accumulated in a temporary buffer instead of being immediately added to the log
2. A 1.5-second debounce timer is started (or reset if already running)
3. If more speech is detected within 1.5 seconds, the new words are appended to the accumulated text
4. When 1.5 seconds pass without new speech, the complete accumulated sentence is added to the message log
5. When transcription is stopped or language is changed, any pending accumulated text is immediately flushed to the log

**Code changes:** In `app/views/HomeView.tsx`
- Lines 46-49: Added `accumulatedTranscriptRef` and `debounceTimerRef` to track accumulated text and debounce timer
- Updated `onresult` handler to use debounce logic instead of immediately adding to log
- Updated cleanup effect to clear debounce timer
- Updated language change effect to flush accumulated text
- Updated `stopTranscription` to flush accumulated text before stopping

## 3. Reversed Log Order

**What changed:** Message log now displays newest messages at the top instead of at the bottom.

**How to test:**
1. Start the application: `npm run dev`
2. Open http://localhost:3000 in a browser (Chrome recommended for Web Speech API support)
3. Click the blue microphone button to start recording
4. Speak multiple phrases in Finnish (the app is configured for Finnish language)
5. Observe that each new transcribed message appears at the **top** of the message log
6. Verify timestamps show newest messages have later times

**Code change:** Line 75 in `app/views/HomeView.tsx`
```typescript
// Before:
setMessageLog(prev => [...prev, { text: transcript, timestamp }]);

// After:
setMessageLog(prev => [{ text: transcript, timestamp }, ...prev]);
```

## 4. Speech Recognition Freeze Prevention

**What was the problem:**
The Web Speech API can stop unexpectedly due to:
- No speech detected for a period (timeout)
- Network issues (API requires network connectivity)
- Audio capture problems
- Browser-imposed limits on continuous recognition

When this happens, the UI shows no indication - it just silently stops transcribing, creating a "freeze" appearance.

**What changed:** Added comprehensive error handling and auto-restart mechanism:

1. **Error Handler (`onerror`)**: Detects and logs errors, automatically restarts on recoverable errors
2. **End Handler (`onend`)**: Detects when recognition stops and automatically restarts if user hasn't manually stopped
3. **State Tracking**: Uses `shouldTranscribeRef` to reliably track intended transcription state
4. **Console Logging**: Provides visibility into when and why recognition stops/restarts

**How to test:**
1. Start the application and begin recording
2. Open browser console (F12) to see logging
3. Try these scenarios:
   - Stay silent for 30+ seconds - should see auto-restart logs
   - Speak continuously - recognition should keep running smoothly
   - Stop and start recording multiple times - should work reliably
4. Check console for messages like:
   - "Speech recognition ended" 
   - "Auto-restarting recognition..."
   - "Speech recognition error: [error type]"

**Code changes:** Lines 87-119 in `app/views/HomeView.tsx`
- Added `shouldTranscribeRef` to track transcription state
- Added `onerror` event handler with auto-restart logic
- Added `onend` event handler with auto-restart logic
- Updated `startTranscription` to set `shouldTranscribeRef.current = true`
- Updated `stopTranscription` to set `shouldTranscribeRef.current = false` before stopping

## 5. Mobile Device Transcription Improvements

**What was the problem:**
Recording on mobile devices (iOS Safari, Android Chrome) was slow and buggy due to:
- Too-short restart delays (100ms) causing "already started" errors
- Missing handling for mobile-specific errors like "aborted"
- Lack of mobile-optimized settings for the Web Speech API
- Different timing requirements on mobile browsers

**What changed:** Optimized speech recognition for mobile devices:

1. **Increased Restart Delay**: Changed from 100ms to 1000ms for both error recovery and end handler
   - Mobile browsers need more time between recognition sessions
   - Prevents "already started" errors that were common on mobile
   
2. **Added "aborted" Error Handling**: Now catches and auto-restarts on "aborted" errors
   - This error is common on mobile devices during continuous recognition
   - Ensures smoother operation on mobile browsers
   
3. **Set maxAlternatives**: Explicitly set to 1 for better mobile performance
   - Improves recognition accuracy on mobile devices
   - Reduces processing overhead

**How to test:**
1. Open the application on a mobile device (iOS Safari or Android Chrome)
2. Grant microphone permissions when prompted
3. Start recording and speak continuously
4. The transcription should:
   - Restart more reliably without "already started" errors
   - Handle interruptions better
   - Provide more consistent results on mobile
5. Monitor console logs to see fewer restart failures

**Code changes:** Lines 98-170 in `app/views/HomeView.tsx`
- Line 105: Added `recognitionRef.current.maxAlternatives = 1;`
- Line 138: Added 'aborted' to error types that trigger auto-restart
- Lines 142-150: Changed restart delay from 100ms to 1000ms in error handler
- Lines 162-168: Changed restart delay from 100ms to 1000ms in end handler
- Added detailed comments explaining mobile device compatibility

## Technical Details

### Why use a ref instead of state for auto-restart?
Event handlers like `onend` and `onerror` capture the state values at the time they were created. Using a ref ensures we always check the current transcription status, preventing race conditions where old event handlers might reference stale state.

### Which errors trigger auto-restart?
- `no-speech`: No speech detected for a period
- `audio-capture`: Issues with microphone access
- `network`: Network connectivity problems
- `aborted`: Recognition was aborted (common on mobile devices)

Other errors (like `not-allowed` for permissions) do not trigger auto-restart as they require user action.

### Why 1000ms delay for mobile?
Mobile browsers, especially iOS Safari and Android Chrome, have stricter timing requirements:
- They need time to fully clean up the previous recognition session
- Starting too quickly can cause "already started" errors
- 1000ms provides a reliable buffer while still feeling responsive

### Browser Compatibility
This application uses the Web Speech API which is primarily supported in Chrome/Edge. Firefox and Safari have limited or no support.

**Mobile Browser Support:**
- **iOS Safari**: Partial support, benefits from the mobile optimizations
- **Android Chrome**: Full support, improved reliability with mobile fixes
- **Android Firefox**: Not supported (Web Speech API limitations)
