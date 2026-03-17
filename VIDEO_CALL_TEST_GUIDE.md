# Video Call Testing Guide

## Quick Start Testing

### Test Environment Setup
1. Ensure you have cameras and microphones on your test devices
2. Open the video-consultation.html page: `http://localhost:5000/video-consultation.html`
3. Ensure you have at least 2 browsers/devices for testing (one patient, one doctor)

---

## Test Scenario 1: Basic Call Flow (Patient → Doctor)

### Patient Side:
1. ✅ Open video-consultation.html
2. ✅ Click "Start Call" (▶️ button)
3. ✅ Browser should ask for camera/mic permission
4. ✅ Local video should appear in the left box
5. ✅ Status should show "Waiting for doctor to join..."
6. ✅ Call ID should be displayed (copy this)
7. ✅ Duration should show "00:00"

### Doctor Side:
1. ✅ Open video-consultation.html in different browser/device
2. ✅ Click "Join Call" (🟢 button)
3. ✅ When prompted, enter the Call ID from patient
4. ✅ Browser should ask for camera/mic permission
5. ✅ Status should change from "Idle" → "Joining call..." → "Connected"
6. ✅ Both should see each other's video
7. ✅ Duration should start counting (00:00 → 00:01 → 00:02...)

---

## Test Scenario 2: Media Controls

### Microphone Toggle 🎤
- [ ] Click mic button while in call
- [ ] Mic button should change green to red (or vice versa)
- [ ] Audio track should be disabled (muted)
- [ ] Other peer should notice audio is off
- [ ] Click again to re-enable

### Camera Toggle 📹
- [ ] Click camera button while in call
- [ ] Camera button should change green to red
- [ ] Local video should go black/freeze
- [ ] Remote peer should see frozen/blank video
- [ ] Click again to re-enable

### Screen Share 🖥️
- [ ] Click screen share button (requires Chrome/Firefox)
- [ ] Browser should show screen selection dialog
- [ ] Select a screen/window
- [ ] Local video should show the shared screen
- [ ] Remote peer should see shared screen
- [ ] When you stop sharing, should return to camera

---

## Test Scenario 3: Chat Functionality

### Sending Messages
- [ ] Type message in chat input: "Hello, can you hear me?"
- [ ] Press Enter or click Send
- [ ] Message should appear on left side with blue background
- [ ] Remote peer should receive message with gray background
- [ ] Chat box should auto-scroll to latest message
- [ ] Input field should clear after sending

### Multiple Messages
- [ ] Send 3-4 messages in rapid succession
- [ ] All should appear in correct order
- [ ] Both peers should receive all messages
- [ ] No messages should be lost

---

## Test Scenario 4: Error Scenarios

### Permission Denied
- [ ] On first call attempt, deny camera permission
- [ ] Should see error: "Permission denied: Please allow camera and microphone access"
- [ ] Status should show the error message
- [ ] Browser console should show detailed error
- [ ] Should still be able to try again

### Invalid Call ID
- [ ] Click "Join Call"
- [ ] Enter random/fake Call ID (e.g., "invalid123")
- [ ] Should see error: "Call not found"
- [ ] Status should show "Call not found"
- [ ] Should be able to try again with correct ID

### No Microphone/Camera
- [ ] Simulate missing device (disable in device manager or unplug)
- [ ] Try to start call
- [ ] Should see: "No camera/microphone found on this device"
- [ ] Should allow reconnecting once device is available

---

## Test Scenario 5: Call Disconnect

### Normal Disconnect
- [ ] While callConnected, click End Call (📞) button
- [ ] Button should disable
- [ ] Status should show "Call ended"
- [ ] Both video streams should stop
- [ ] Duration should reset to "00:00"
- [ ] Start/Join buttons should re-enable

### Page Refresh During Call
- [ ] Refresh the page while call is active
- [ ] Browser should ask to leave the page
- [ ] Should be able to confirm leave
- [ ] Call should properly cleanup

### Network Disconnect
- [ ] Disconnect one peer's network
- [ ] Other peer should see "Disconnected" or "Connection failed"
- [ ] Should still be able to end the call
- [ ] Connection should cleanup gracefully

---

## Test Scenario 6: Call Duration Tracking

### Duration Display
- [ ] Start a call
- [ ] Duration should start as "00:00"
- [ ] After 5 seconds, should show "00:05"
- [ ] After 1 minute, should show "01:00"
- [ ] After 2 min 30 sec, should show "02:30"

### Duration Accuracy
- [ ] Time should increment every second
- [ ] No delays or jumps in counter
- [ ] Should match actual elapsed time closely

### Duration Reset
- [ ] End the call
- [ ] Duration should reset to "00:00"
- [ ] Start new call
- [ ] Duration should start fresh from "00:00"

---

## Test Scenario 7: Multiple Sequential Calls

### Call 1
- [ ] Start call as patient
- [ ] Doctor joins
- [ ] Chat a bit
- [ ] Send a message
- [ ] End call

### Call 2 (same users)
- [ ] Start new call as patient
- [ ] Should get new Call ID
- [ ] Doctor joins with new ID
- [ ] Video should work correctly
- [ ] Chat should work
- [ ] End call

- [ ] Verify no leftover state from call 1
- [ ] Verify all UI resets properly

---

## Test Scenario 8: Mobile Responsiveness

### Tablet View
- [ ] Open on iPad/tablet
- [ ] Rotate to portrait
- [ ] Video containers should stack vertically
- [ ] Sidebar should be below videos
- [ ] Buttons should still be clickable
- [ ] Rotate back to landscape
- [ ] Layout should adjust back to side-by-side

### Mobile View
- [ ] Open on mobile phone
- [ ] Videos should be full width
- [ ] Controls should be accessible
- [ ] Sidebar should be scrollable
- [ ] Chat should not interfere with video
- [ ] All buttons should be tap-friendly

---

## Console Check

After each test, check browser console (F12 → Console) for:

✅ Expected Messages:
```
Camera started (or Local stream obtained)
Chat data channel open
Peer connection state: connected
Chat data channel closed (on call end)
```

⚠️ Warning Messages (These are OK):
```
Could not fetch patient name: [error]
Failed to cleanup call room: [error]
```

❌ Error Messages (These are NOT OK):
```
ReferenceError: [element] is not defined
Cannot read property of undefined
Failed to create call room
```

---

## Performance Checklist

### Memory Usage
- [ ] Open call and watch Task Manager/Activity Monitor
- [ ] Memory should stabilize after connection
- [ ] Memory should decrease after call ends
- [ ] No continuous memory growth

### Network Usage
- [ ] Download: Should see steady video stream data
- [ ] Upload: Should see your camera stream being sent
- [ ] No unexpected network spikes

### CPU Usage
- [ ] Should use 1-2 cores per video stream
- [ ] Should decrease after call ends
- [ ] No continuous 100% CPU usage

---

## Browser DevTools Debugging

### Check Real-time Stats
```
Right-click on video → Open Media Inspector (Firefox)
or
chrome://webrtc-internals/ (Chrome)
```

Monitor:
- **Byte sent/received**: Should show activity
- **Frames sent/received**: Should see video frames
- **Audio level**: Should see audio activity when speaking
- **Connection state**: Should show "connected"
- **Candidate pairs**: Should show selected candidate

---

## Expected Results Summary

| Feature | Expected Result | Status |
|---------|-----------------|--------|
| Start Call | Generates Call ID, local video shows | ✅ |
| Join Call | Can join with valid Call ID | ✅ |
| Local Video | Displays sender's camera | ✅ |
| Remote Video | Displays receiver's camera | ✅ |
| Mic Toggle | Mutes/unmutes audio | ✅ |
| Camera Toggle | Disables/enables video | ✅ |
| Screen Share | Shows screen instead of camera | ✅ |
| Chat Messages | Sends & receives text | ✅ |
| Duration | Counts up MM:SS format | ✅ |
| End Call | Closes connection properly | ✅ |
| Error Handling | Shows clear error messages | ✅ |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Camera/Mic permission required" | Check browser settings, reload and allow access |
| "Call not found" | Verify correct Call ID, check Firestore exists |
| No video showing | Check camera permissions, try another browser |
| Audio not working | Check microphone permissions, test by refreshing |
| Messages not sending | Wait for data channel to open fully |
| Connection drops | Check network, may require reconnect |

---

**Test Completed:** [_______________]
**Date:** [_______________]
**Tester Name:** [_______________]
**Browser:** [_______________]
**Notes:** [_______________________________________________]
