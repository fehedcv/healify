# Healify - Online Medical Consultancy Platform

## 🏥 Project Overview

Healify is a comprehensive telemedicine platform that enables patients and doctors to connect for online medical consultations with real-time video communication, digital prescriptions, and electronic medical records.

**Tech Stack:**
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python (Flask), PHP, Node.js (Express)
- **Database:** MySQL, MongoDB
- **Real-time:** WebRTC for video, Socket.io for signaling
- **Authentication:** JWT Tokens

---

## 📁 Project Structure

```
healify/
├── frontend/              # HTML/CSS/JavaScript frontend
│   ├── index.html        # Homepage
│   ├── login.html        # Login page
│   ├── styles.css        # Global styles
│   ├── script.js         # Main JavaScript
│   └── video-consultation.html
├── backend/
│   ├── python/           # Flask backend
│   │   ├── app.py
│   │   └── routes/
│   ├── php/              # PHP backend
│   │   ├── index.php
│   │   └── config/
│   └── nodejs/           # Express.js backend
│       ├── server.js
│       └── package.json
├── database/
│   ├── mysql/            # MySQL schema
│   │   └── schema.sql
│   └── mongodb/          # MongoDB schema
│       └── schema.js
├── webrtc/               # WebRTC implementation
│   ├── webrtc-client.js
│   └── webrtc-socket.js
└── docs/                 # Documentation
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- Python 3.8+
- PHP 7.4+
- MySQL 5.7+ or MongoDB 4.4+

### Frontend Setup
```bash
cd frontend
# Serve using Live Server or any HTTP server
python -m http.server 8000
```

### Backend Setup (Choose One)

**Python (Flask):**
```bash
cd backend/python
pip install -r requirements.txt
python app.py
```

**Node.js (Express):**
```bash
cd backend/nodejs
npm install
npm run dev
```

**PHP:**
```bash
cd backend/php
php -S localhost:5000
```

### Database Setup

**MySQL:**
```bash
mysql -u root -p < database/mysql/schema.sql
```

**MongoDB:**
```bash
mongo < database/mongodb/schema.js
```

---

## 🔑 Key Features

✅ **User Authentication**
- Secure login/registration
- Patient and Doctor roles
- JWT token-based auth

✅ **Doctor Management**
- Doctor profiles with specializations
- Availability management
- Rating and reviews

✅ **Appointment Booking**
- Real-time appointment scheduling
- Automated reminders
- Cancellation workflow

✅ **Video Consultation**
- WebRTC peer-to-peer video calls
- Real-time messaging
- Screen sharing support

✅ **Digital Prescriptions**
- Prescription generation
- Medicine tracking
- Lab test recommendations

✅ **Medical Records**
- Patient health history
- Secure data storage
- EMR integration

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/<id>` - Get doctor details
- `POST /api/doctors/register` - Doctor registration

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/user/<userId>` - Get user appointments
- `PUT /api/appointments/<id>` - Update appointment

### Consultations
- `POST /api/consultations` - Create consultation
- `GET /api/consultations/<id>` - Get consultation
- `PUT /api/consultations/<id>/start` - Start consultation
- `PUT /api/consultations/<id>/end` - End consultation

### Prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions/<id>` - Get prescription
- `PUT /api/prescriptions/<id>/issue` - Issue prescription

---

## 🔐 Environment Variables

Create `.env` files in each backend directory:

```env
# Backend Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/healify
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=healify

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=30d

# Third-party APIs
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# WebRTC
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=your-turn-server
```

---

## 🎥 WebRTC Video Consultation

### Usage

```javascript
// Initialize WebRTC with Socket.io
const webrtcSocket = new HealifyWebRTCSocket('http://localhost:5000');

// Join consultation room
await webrtcSocket.joinRoom('room-123', 'user-456');

// Setup local video
webrtcSocket.webrtc.on('LocalStream', (stream) => {
    document.getElementById('localVideo').srcObject = stream;
});

// Setup remote video
webrtcSocket.webrtc.on('RemoteStream', (stream, peerId) => {
    document.getElementById('remoteVideo').srcObject = stream;
});

// Send message
webrtcSocket.sendMessage('Hello doctor!');

// Leave room
webrtcSocket.leaveRoom();
```

---

## 📱 Frontend Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with features |
| Login | `/login.html` | User login |
| Register | `/register.html` | User registration |
| Doctor List | `/doctors.html` | Browse doctors |
| Booking | `/booking.html` | Appointment booking |
| Consultation | `/video-consultation.html` | Live video call |
| Dashboard | `/patient-dashboard.html` | Patient dashboard |

---

## 🔧 Backend Architecture

### Python (Flask)
- RESTful API with blueprints
- MongoDB integration with PyMongo
- JWT authentication middleware
- Modular route structure

### Node.js (Express)
- Express.js server with Socket.io
- Mongoose ODM for MongoDB
- JWT middleware
- Real-time WebSocket support

### PHP
- Procedural backend
- PDO for database abstraction
- JWT token generation
- CORS-enabled API

---

## 📊 Database Schema

### Users Table
- id, email, password, name, userType, phone, avatar, isVerified

### Doctors Table
- userId, specialty, experience, consultationFee, licenseNumber, rating

### Appointments Table
- patientId, doctorId, appointmentDate, timeSlot, status, paymentStatus

### Consultations Table
- appointmentId, consultationType, roomId, startedAt, endedAt, recording

### Prescriptions Table
- consultationId, doctorId, diagnosis, medicines, tests, status

---

## 🚀 Deployment

### Backend
- **Python:** Deploy to Heroku, PythonAnywhere, AWS
- **Node.js:** Deploy to Heroku, Railway, AWS, Vercel
- **PHP:** Deploy to cPanel hosting, AWS Lightsail, Bluehost

### Frontend
- Deploy to Netlify, Vercel, AWS S3, GitHub Pages

### Database
- **MySQL:** AWS RDS, DigitalOcean, Linode
- **MongoDB:** MongoDB Atlas, AWS DocumentDB

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under MIT License.

---

## 🆘 Support

For issues and support, please create an issue in the repository or contact our support team.

**Email:** support@healify.com
**Website:** www.healify.com
