# Jitsi Meet Video Call Implementation Guide

## Overview
The Healify application has been successfully migrated from WebRTC to **Jitsi Meet**, a robust, open-source video conferencing platform. This implementation uses Firebase Authentication to identify users and manage video consultation rooms.

## Architecture

### How It Works

1. **Patient Initiates Call**
   - Patient selects a doctor from the patient dashboard
   - Patient is redirected to `video-consultation.html?doctorId={doctorId}`
   - Jitsi creates an incoming call notification in Firebase (`incomingCalls` collection)
   - Jitsi establishes connection with auto-generated room name

2. **Doctor Receives Call**
   - Doctor dashboard polls for `incomingCalls` in real-time
   - Notification appears in doctor's "Incoming Calls" section
   - Doctor clicks "Accept Call" to join the same Jitsi room
   - Both participants see each other in the video conference

3. **Scheduled Appointments**
   - When both are ready for a scheduled appointment, doctor clicks "Start Call"
   - Doctor is redirected to `video-consultation.html?appointment={appointmentId}`
   - Patient uses the same appointment ID to join
   - Automatic room name: `healify-appointment-{appointmentId}`

4. **Room Name Generation**
   - **Direct calls**: `healify-consultation-{sorted-user-ids}`
   - **Appointments**: `healify-appointment-{appointmentId}`
   - **Call ID based**: `healify-call-{callId}`

## Key Files

### Frontend Files

- **`video-consultation.html`**: Main consultation page featuring Jitsi Meet embedded iframe
  - Simple layout with Jitsi Conference on the left, info sidebar on the right
  - Automatically loads Jitsi Meet from `meet.jitsi.si`

- **`jitsi-video-call.js`**: Jitsi integration script
  - Handles Firebase authentication
  - Generates unique room names
  - Creates incoming call notifications
  - Manages participant count
  - Provides cleanup on exit

- **`firebase-config.js`**: Firebase configuration (already exists)
  - Initializes Firebase app
  - Exports auth and db instances

- **`patient-dashboard.js`**: Patient dashboard (updated parameters)
  - Redirects to video consultation with `doctorId` parameter

- **`doctor-dashboard.html`**: Doctor dashboard (handles incoming calls)
  - Listens for `incomingCalls` collection
  - Displays notification with accept/decline options
  - Redirects doctor to video-consultation with call ID

## URL Parameters

The `video-consultation.html` page supports these URL parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `doctorId` | Doctor's Firebase UID (patient initiating call) | `?doctorId=user123` |
| `appointment` | Appointment ID (scheduled consultation) | `?appointment=appt456` |
| `id` | Call ID (doctor accepting incoming call) | `?id=call789` |

## Firebase Collections

### incomingCalls
Structure for incoming call notifications:
```json
{
  "doctorId": "firebase_uid",
  "patientId": "firebase_uid",
  "patientName": "Patient Name",
  "callId": "healify-consultation-...",
  "timestamp": "server_timestamp",
  "status": "pending"
}
```

## Jitsi Meet Configuration

The Jitsi Meet interface includes:

### Toolbar Buttons (Visible)
- Microphone toggle
- Camera toggle
- Closed captions
- Desktop sharing
- Fullscreen
- Device selection
- Hangup
- Chat
- Recording
- Live streaming
- Settings
- Raise hand
- Video quality selector
- Filmstrip
- Feedback
- Statistics
- Shortcuts
- Tile view
- Toggle camera view

### Disabled Features
- Lobby mode (disabled)
- Pre-join page (disabled)
- Brand watermark

### Custom Branding
- Jitsi watermark displayed
- Healify logo can be configured
- Custom display names with user role

## User Identification

### Patient
- Stored in localStorage: `patientId`, `patientName`
- Fetched from Firestore: `patients/{patientId}`
- Display name: Patient's registered name

### Doctor
- Stored in localStorage: `doctorId`, `doctorName`
- Fetched from Firestore: `doctors/{doctorId}`
- Display name: Doctor's registered name with "Dr." prefix

## Flow Diagrams

### Patient-Initiated Call
```
Patient Dashboard
    ↓ (clicks "Call")
video-consultation.html?doctorId=XXX
    ↓
Jitsi initializes with room name
    ↓
Incoming call created in Firebase
    ↓
Doctor Dashboard (notification)
    ↓ (clicks "Accept")
video-consultation.html?id=callId
    ↓
Both join same Jitsi room
    ↓
Video conference starts
```

### Scheduled Appointment
```
Doctor Dashboard
    ↓ (clicks "Start Call" on appointment)
video-consultation.html?appointment=APPT_ID
    ↓
Patient Dashboard (or URL share)
    ↓ (patient joins from)
video-consultation.html?appointment=APPT_ID
    ↓
Both join same Jitsi room
    ↓
Video conference starts
```

## Testing the Implementation

### Test Scenario 1: Direct Call
1. **Patient**: Log in as patient, browse doctors
2. **Patient**: Click "Call" on a doctor
3. **Doctor**: Check incoming calls notification
4. **Doctor**: Click "Accept Call"
5. **Expected**: Both see each other in Jitsi Meet interface

### Test Scenario 2: Scheduled Appointment
1. **Doctor**: Create appointment with patient for specific time
2. **Doctor**: On dashboard, click "Start Call" on appointment
3. **Patient**: Access video-consultation.html with same appointment ID
4. **Expected**: Both see each other in same Jitsi room

### Test Scenario 3: Cross-Browser
1. Test on Chrome, Firefox, Safari, Edge
2. Test on mobile browsers
3. Expected: Jitsi Meet responsive design adapts to all screen sizes

## Troubleshooting

### Issue: Camera/Microphone not working
- **Solution**: Check browser permissions for camera/microphone
- Allow access when browser prompts
- Check device settings

### Issue: "Meet.jitsi.si" is not loading
- **Solution**: Check internet connection
- Verify firewall allows Jitsi domains
- Try using Firefox or Chrome (better compatibility)

### Issue: Incoming calls not appearing
- **Solution**: Ensure doctor is logged in as doctor role
- Check Firefox notifications settings
- Verify Firestore `incomingCalls` collection exists and has write permissions

### Issue: Room names not matching
- **Solution**: Verify both users accessing with correct parameters
- Check Firebase doesn't have timezone/timestamp issues
- Clear browser cache and localStorage if needed

## Performance Considerations

- **Jitsi Meet**: Handles up to 4-5 participants without issues
- **Firebase Firestore**: Real-time listener for incoming calls (costs ~1 read per check)
- **Network**: Requires minimum 2.5 Mbps for HD video
- **Browser**: Modern browsers (Chrome 80+, Firefox 75+, Safari 13+)

## Security

- Firebase Authentication required for all users
- User IDs (UID) are randomly generated by Firebase
- No sensitive data in URL parameters (only IDs and appointment refs)
- Jitsi Meet connection is encrypted (HTTPS only)
- Firebase Firestore has rules to restrict access by role

## Future Enhancements

1. Add call recording (Jitsi built-in feature)
2. Add virtual backgrounds
3. Add meeting transcription
4. Implement call history logging
5. Add real-time chat in sidebar
6. Integrate calendar invitations
7. Add pre-call device testing

## Migration Notes

### What Changed
- ❌ Removed: WebRTC implementation (`webrtc/` folder files)
- ❌ Removed: Custom peer connection logic
- ❌ Removed: ICE candidate handling
- ✅ Added: Jitsi Meet External API
- ✅ Added: Simple room-based architecture
- ✅ Kept: Firebase authentication flow
- ✅ Kept: Firestore for notifications

### Backwards Compatibility
- Old WebRTC files can be removed from the project
- All existing Firebase collections remain unchanged
- Patient and doctor dashboards work with new system

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Firebase configuration in `firebase-config.js`
3. Check Firebase Firestore rules allow necessary access
4. Test Jitsi directly at https://meet.jitsi.si
