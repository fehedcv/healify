# Call Notification Implementation for Healify

## Overview
Implemented a comprehensive call notification system that alerts doctors when patients initiate video calls, both through scheduled appointments and direct calls.

## Features Implemented

### 1. **Browser Notifications**
- System-level notifications appear even when the browser is not in focus
- Click notifications to accept the call directly
- Displays patient name and call status
- Persistent notifications that require user interaction

### 2. **Audio Alerts**
- Two-tone audio alert plays when a call comes in
- Uses Web Audio API to generate sound (800 Hz sine wave)
- Plays twice for better audibility

### 3. **Visual Notifications**
- Page title flashes with incoming call information
- Incoming calls section auto-scrolls into view
- New call items pulse in with animation
- Real-time pending call count in dashboard

### 4. **Call Notification Types**
- **Scheduled Appointment Calls**: When a patient initiates a call linked to an appointment
- **Direct Doctor Calls**: When a patient calls a specific doctor without an appointment

## Technical Implementation

### Modified Files

#### 1. **`frontend/doctor-dashboard.html`**
- Added `requestNotificationPermission()` function to request browser notification access
- Added `showCallNotification()` function to handle incoming call alerts
- Added `playCallSound()` function using Web Audio API for audio alerts
- Added `flashPageTitle()` function to flash page title
- Updated `setupRealTimeListeners()` to trigger notifications on new calls
- Added CSS animation `pulse-in` for new call items

**Key Functions Added:**
```javascript
// Request notification permissions on dashboard load
async function requestNotificationPermission()

// Display notification, play sound, and highlight the call
function showCallNotification(callData, docId)

// Generate audio tone using Web Audio API
function playCallSound()

// Flash the browser tab title
function flashPageTitle(title)
```

#### 2. **`webrtc/video-call.js`**
- Extract `doctorId` and `doctorName` from URL parameters
- Extract `patientId` from localStorage
- Enhanced `startCall()` function to handle two scenarios:
  - Calls with appointment ID (existing functionality)
  - Calls without appointment ID (new direct call support)
- Both scenarios now create notification entries in Firestore

**Key Changes:**
```javascript
const doctorId = new URLSearchParams(window.location.search).get('doctorId');
const doctorName = new URLSearchParams(window.location.search).get('doctorName');
const patientId = localStorage.getItem('patientId') || localStorage.getItem('userId');
```

#### 3. **`frontend/patient-auth.js`**
- Added login functionality (was missing)
- Store `patientId` in localStorage after successful registration/login
- Store `patientName` in localStorage for notification display

**Key Additions:**
```javascript
// On successful login/registration
localStorage.setItem('patientId', uid);
localStorage.setItem('patientName', nameInput.value);
```

#### 4. **`frontend/doctor-auth.js`**
- Store `doctorId` in localStorage after successful login
- Ensures doctor ID is available for notification filtering

**Key Addition:**
```javascript
// On successful login
localStorage.setItem('doctorId', uid);
```

## Firestore Structure

### `incomingCalls` Collection
When a call is initiated, a document is created with:

```javascript
{
  callId: string,           // WebRTC call/room ID
  patientId: string,        // UID of calling patient
  doctorId: string,         // UID of target doctor
  patientName: string,      // Patient name display
  appointmentId: string,    // (Optional) Linked appointment
  createdAt: timestamp      // Server timestamp
}
```

## Call Flow

### Scenario 1: Scheduled Appointment Call
1. Patient logs in (patientId stored)
2. Patient navigates to appointment
3. Patient clicks "Start Call" on appointment
4. Video consultation starts with appointmentId in URL
5. `video-call.js` reads appointmentId and creates notification entry
6. Doctor's dashboard listens for new incoming calls
7. Doctor receives notification with patient name
8. Doctor accepts call and joins video consultation

### Scenario 2: Direct Doctor Call
1. Patient logs in (patientId, patientName stored)
2. Patient browses available doctors on dashboard
3. Patient clicks "Call" on a doctor
4. Video consultation starts with doctorId in URL
5. `video-call.js` reads doctorId and creates direct call notification
6. Doctor's dashboard receives notification
7. Doctor accepts call and joins video consultation

## Browser Compatibility

- **Notifications API**: Chrome, Firefox, Safari, Edge (modern versions)
- **Web Audio API**: All modern browsers
- **localStorage**: All modern browsers

## User Experience

### For Doctors:
1. Receive system notification when patient calls
2. Sound alert plays even if window is minimized/not focused
3. Notification can be clicked to accept call directly
4. Dashboard shows pending calls count
5. Call items animate in for visual feedback

### For Patients:
1. Initiate call with "Start Call" button
2. Call notification sent to assigned doctor
3. Wait for doctor to accept call
4. Join video consultation once doctor joins

## Notification Permissions

The system requests notification permissions on:
- First doctor dashboard load
- User can grant/deny permissions
- If denied, notifications won't show (other features still work)

## Testing Checklist

- [ ] Doctor receives notification when patient initiates scheduled appointment call
- [ ] Doctor receives notification when patient initiates direct call
- [ ] Audio alert plays when call comes in
- [ ] Page title flashes when call comes in
- [ ] Incoming calls section scrolls into view automatically
- [ ] Click notification to accept call works
- [ ] Pending calls count updates in real-time
- [ ] Decline call removes notification from list
- [ ] Accept call navigates to video consultation
- [ ] Works across browser windows/tabs
- [ ] Notifications work even with browser minimized

## Future Enhancements

1. **Email Notifications**: Send email alert to doctor
2. **SMS Notifications**: Send SMS to doctor's phone
3. **Call Duration**: Show how long patient has been waiting
4. **Call Recording**: Record consultation for review
5. **Call History**: Track all incoming/outgoing calls
6. **Do Not Disturb**: Option to mute notifications
7. **Call Queue**: Queue calls if doctor is busy
8. **Priority Levels**: Mark urgent calls differently
