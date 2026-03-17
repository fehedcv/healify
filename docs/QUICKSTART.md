# Healify - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Clone/Download Project
```bash
cd /Users/amith/Coding
# Project is at: /Users/amith/Coding/healify
```

### Step 2: Frontend Setup
```bash
cd healify/frontend

# Option 1: Using Python (macOS/Linux)
python -m http.server 8000

# Option 2: Using Node.js
npx http-server

# Option 3: VS Code Live Server Extension
# Right-click index.html → Open with Live Server
```

Visit: **http://localhost:8000**

### Step 3: Backend Setup (Choose ONE)

#### Python (Flask)
```bash
cd healify/backend/python

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install flask flask-cors flask-jwt-extended pymongo python-dotenv bcryptjs

# Create .env file
cp ../../.env.example .env

# Run server
python app.py
```

#### Node.js (Express) - RECOMMENDED
```bash
cd healify/backend/nodejs

# Install dependencies
npm install

# Create .env file
cp ../../.env.example .env

# Run with auto-reload
npm run dev
```

#### PHP
```bash
cd healify/backend/php

# Run server
php -S localhost:5000
```

**Backend runs on:** `http://localhost:5000`

### Step 4: Database Setup

#### MongoDB (Recommended for quick start)
```bash
# Start MongoDB
mongod

# Option 1: Using Node.js setup script (Easiest)
node backend/nodejs/setup-mongodb.js

# Option 2: Using mongosh directly (MongoDB 5.0+)
mongosh < database/mongodb/schema.js

# Option 3: Manual mongosh connection
mongosh "mongodb://localhost:27017/healify"
```

#### MySQL
```bash
# Start MySQL
mysql -u root -p

# Load schema
source healify/database/mysql/schema.sql;
```

### Step 5: Test the Application

1. **Open Frontend:** http://localhost:8000
2. **Click "Login"** → Register as Patient or Doctor
3. **Fill Form:**
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `John Doe`
   - User Type: `Patient` or `Doctor`
4. **Click Submit** → Should see success message

### Step 6: Test API

```bash
# Register User
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "password123",
    "name": "Dr. Smith",
    "userType": "doctor",
    "specialty": "Cardiologist"
  }'

# Get Doctors
curl http://localhost:5000/api/doctors

# Health Check
curl http://localhost:5000/api/health
```

---

## 📊 Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Frontend   │         │  Backend    │         │  Database    │
│ (Port 8000) │◄──────►│ (Port 5000) │◄──────►│ (27017/3306) │
│ HTML/CSS/JS │         │ Python/Node │         │ Mongo/MySQL  │
└─────────────┘         └─────────────┘         └──────────────┘
       ↓                        ↓
  Local Storage         JWT Authentication
     (Token)            MongoDB/MySQL
                        Socket.io
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `frontend/index.html` | Homepage |
| `frontend/login.html` | Login/Register |
| `frontend/video-consultation.html` | Video call page |
| `backend/nodejs/server.js` | Node.js entry point |
| `backend/python/app.py` | Flask entry point |
| `database/mongodb/schema.js` | MongoDB collections |
| `database/mysql/schema.sql` | MySQL tables |
| `.env.example` | Configuration template |

---

## 🔑 Default Login Credentials

After registering:
- **Email:** test@example.com
- **Password:** password123
- **User Type:** Patient or Doctor

---

## 🎯 Next Steps

### For Patients
1. ✅ Register as Patient
2. ✅ Login to dashboard
3. ✅ Browse doctors
4. ✅ Book appointment
5. ✅ Start video consultation

### For Doctors
1. ✅ Register as Doctor
2. ✅ Complete profile (specialty, license)
3. ✅ Set availability
4. ✅ Accept appointments
5. ✅ Conduct consultations
6. ✅ Write prescriptions

### For Developers
1. ✅ Explore backend routes in `/backend`
2. ✅ Check API endpoints documentation
3. ✅ Modify frontend pages
4. ✅ Add new features
5. ✅ Deploy to production

---

## ⚠️ Troubleshooting

### "Cannot GET /"
- Frontend not running
- Check: http://localhost:8000

### API Connection Error
- Backend not running
- Check: http://localhost:5000/api/health
- Verify port in `.env` is 5000

### Database Connection Error
- MongoDB/MySQL not running
- MongoDB: `mongod` or `brew services start mongodb-community`
- MySQL: `mysql.server start` or check XAMPP

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000
kill -9 <PID>

# Or use different port
# Edit .env: PORT=5001
```

### Module Not Found (Python/Node.js)
```bash
# Python
pip install -r requirements.txt

# Node.js
npm install
```

---

## 📚 Documentation

- **Full Setup:** See `docs/SETUP.md`
- **API Reference:** See `docs/API.md`
- **Database Schema:** See `database/mysql/schema.sql`
- **Configuration:** See `.env.example`

---

## 🎮 Demo Walkthrough

### 1. Register Patient
```
http://localhost:8000/login.html
→ Click "Register here"
→ Select "Patient"
→ Fill form
→ Submit
```

### 2. Browse Doctors
```
http://localhost:8000
→ Scroll to "Find Doctors"
→ Click doctor cards
→ View profiles
```

### 3. Book Appointment
```
Patient Dashboard
→ Select Doctor
→ Choose Date/Time
→ Add Symptoms
→ Confirm Booking
```

### 4. Video Consultation
```
Consultation Page
→ Click "Start Call"
→ Allow Camera/Mic
→ Chat with Doctor
→ Share Screen (optional)
→ End Call
```

---

## 🚀 Production Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
git push origin main
# Auto-deploy on Vercel
```

### Backend (Heroku/Railway)
```bash
cd backend/nodejs
git push heroku main
# Or use Railway dashboard
```

### Database (Atlas/AWS RDS)
- Setup MongoDB Atlas cluster
- Update MONGODB_URI in .env
- Or use AWS RDS for MySQL

---

## 📞 Support

**Issues?**
1. Check troubleshooting section above
2. Review documentation in `/docs`
3. Check backend logs for errors
4. Review browser console for frontend errors

---

**Happy coding! 🎉**

Start with the frontend at **http://localhost:8000**
