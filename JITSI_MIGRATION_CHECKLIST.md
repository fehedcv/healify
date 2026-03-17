# Jitsi Meet Migration Checklist

## Implementation Complete ✅

### Files Created/Updated

- [x] **video-consultation.html** - Replaced with Jitsi Meet UI
- [x] **jitsi-video-call.js** - Created new Jitsi integration script
- [x] **JITSI_IMPLEMENTATION.md** - Created comprehensive guide

### Files Kept (No Changes Needed)

- [x] **firebase-config.js** - Firebase configuration (unchanged)
- [x] **patient-dashboard.js** - Uses existing parameter passing
- [x] **doctor-dashboard.html** - Already has incoming calls support
- [x] **patient-auth.js** - Already stores user info
- [x] **doctor-auth.js** - Already stores user info
- [x] **logout.js** - Already works with current setup

### Old WebRTC Files (Can Be Removed)

The following WebRTC implementation files are no longer used:
- ⚠️ `/frontend/webrtc/video-call.js` - OLD (can delete)
- ⚠️ `/frontend/webrtc/webrtc-client.js` - OLD (can delete)
- ⚠️ `/frontend/webrtc/webrtc-socket.js` - OLD (can delete)

**Note**: These are safe to remove. The new Jitsi implementation doesn't use them.

## Deployment Steps

### 1. Local Testing
```bash
# Test in development environment
npm start  # or your server command

# Access the app:
# - Patient: http://localhost:PORT/patient-login.html
# - Doctor: http://localhost:PORT/doctor-login.html
```

### 2. Verify Firebase Setup
```
✓ Firebase project configured
✓ Firestore database created
✓ Collections exist:
  - patients
  - doctors
  - appointments
  - incomingCalls (auto-created on first call)
✓ Firebase rules updated (if needed)
```

### 3. Test Various Flows

**Flow 1: Patient Initiates Call**
- [ ] Patient logs in
- [ ] Patient clicks "Call" on doctor
- [ ] Doctor receives notification
- [ ] Doctor accepts call
- [ ] Video connects

**Flow 2: Appointment-Based Call**
- [ ] Create appointment in system
- [ ] Doctor starts call from appointment
- [ ] Patient joins with same appointment ID
- [ ] Video connects

**Flow 3: Mobile Compatibility**
- [ ] Test on mobile browser (iOS Safari)
- [ ] Test on mobile browser (Android Chrome)
- [ ] Verify responsive layout works
- [ ] Verify video quality adapts

### 4. Production Deployment
```bash
# Before deploying to production:

1. Remove old WebRTC files (optional but recommended)
2. Verify all Firebase rules are in place
3. Test on staging environment
4. Deploy to Firebase Hosting or production server
5. Run smoke tests on production
```

## Parameter Reference

### URLs Used in System

**Patient calling doctor:**
```
video-consultation.html?doctorId=<doctor-firebase-uid>&doctorName=<doctor-name>
```

**Doctor accepting call:**
```
video-consultation.html?id=<call-id>&appointment=<optional-appointment-id>
```

**Scheduled appointment:**
```
video-consultation.html?appointment=<appointment-id>
```

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Jitsi not loading | Check internet, verify `https://meet.jitsi.si` is accessible |
| Camera not working | Check browser permissions, device settings |
| Incoming calls not appearing | Ensure doctor logged in, check Firestore collection |
| Room names different for each user | Verify URL parameters are passed correctly |

## Firebase Firestore Rules

Ensure your Firestore security rules allow:
```javascript
// incomingCalls collection - Doctor can read their calls
match /incomingCalls/{docId} {
  allow read: if request.auth.uid == resource.data.doctorId;
  allow create: if request.auth != null;
  allow delete: if request.auth.uid == resource.data.doctorId;
}
```

## Environment Variables

No additional environment setup needed. Configuration is in:
- [`firebase-config.js`](firebase-config.js) - Firebase API keys

## Browser Support

✅ **Fully Supported:**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

⚠️ **Limited Support:**
- Safari on iOS (some features may not work)
- Mobile Firefox

## Performance Notes

- Bandwidth: 2.5-4 Mbps recommended for HD
- CPU: Low impact, Jitsi handles encoding
- RAM: ~150MB per browser tab
- Latency: <150ms recommended

## Success Indicators

After implementation:
- [ ] Patient can see available doctors
- [ ] Patient can initiate call with doctor
- [ ] Doctor receives notification
- [ ] Doctor can accept/decline call
- [ ] Video conference starts without delay
- [ ] Both can see and hear each other
- [ ] Can end call and return to dashboard
- [ ] Mobile interface is responsive

## Next Steps (Optional Enhancements)

1. **Recording**: Enable Jitsi recording feature
2. **Chat**: Use iframe postMessage for integrated chat
3. **Analytics**: Track call duration, participants
4. **Notifications**: Add desktop/SMS notifications
5. **History**: Log all consultations to database
