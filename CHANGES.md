# Changes Summary

## 1. Reversed Log Order

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

## 2. Speech Recognition Freeze Prevention

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

## 3. Mobile Device Transcription Improvements

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
