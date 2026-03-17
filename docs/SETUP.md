# Healify Backend Setup Guide

## Python (Flask) Setup

### Installation
```bash
cd backend/python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install flask
pip install flask-cors
pip install flask-jwt-extended
pip install pymongo
pip install python-dotenv
pip install bcryptjs
```

### Create requirements.txt
```bash
pip freeze > requirements.txt
```

### Environment Variables (.env)
```env
FLASK_ENV=development
FLASK_APP=app.py
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healify
JWT_SECRET_KEY=your-secret-key-change-in-production
```

### Run Server
```bash
python app.py
# Server runs on http://localhost:5000
```

---

## Node.js (Express) Setup

### Installation
```bash
cd backend/nodejs
npm install

# Or install individually:
npm install express cors mongoose jsonwebtoken bcryptjs dotenv socket.io express-validator
```

### Environment Variables (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/healify
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=30d
```

### Run Server
```bash
npm run dev
# Server runs on http://localhost:5000 with hot reload
```

---

## PHP Setup

### Requirements
- PHP 7.4+
- MySQL/MariaDB
- Composer (optional)

### Configuration
Edit `backend/php/config/Database.php`:
```php
private $host = 'localhost';
private $db_name = 'healify';
private $user = 'root';
private $password = '';  // Add your password
```

### Run Server
```bash
cd backend/php
php -S localhost:5000
# Server runs on http://localhost:5000
```

---

## Database Setup

### MySQL
```bash
# Create database and tables
mysql -u root -p < database/mysql/schema.sql

# Or manually:
mysql -u root -p
> CREATE DATABASE healify;
> USE healify;
> /* Copy-paste SQL from schema.sql */
```

### MongoDB
```bash
# Start MongoDB
mongod

# In another terminal
mongo

# Load schema
load("database/mongodb/schema.js")

# Or manually:
mongo < database/mongodb/schema.js
```

---

## API Testing

### Using cURL
```bash
# Register User
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123",
    "name": "John Doe",
    "userType": "patient"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'

# Get Doctors
curl -X GET http://localhost:5000/api/doctors

# Create Appointment
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "doctorId": "doctor-id",
    "appointmentDate": "2026-02-15",
    "timeSlot": "10:00",
    "symptoms": "Fever and cough"
  }'
```

### Using Postman
1. Import collection from `/docs/postman-collection.json`
2. Set environment variables (token, userId, etc.)
3. Test endpoints

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- Verify database name matches

### CORS Error
- Enable CORS in backend (already done)
- Check frontend URL in CORS configuration
- Ensure credentials are sent if needed

### JWT Token Expired
- Generate new token via login endpoint
- Check JWT_EXPIRES_IN value
- Verify token format: `Bearer <token>`

---

## Running All Services

### Script for macOS/Linux
```bash
#!/bin/bash

# Terminal 1 - MongoDB
echo "Starting MongoDB..."
mongod &

# Terminal 2 - Backend (choose one)
echo "Starting Node.js Backend..."
cd backend/nodejs
npm run dev &

# Terminal 3 - Frontend
echo "Starting Frontend..."
cd frontend
python -m http.server 8000 &

echo "All services running!"
echo "Frontend: http://localhost:8000"
echo "Backend: http://localhost:5000"
```

### Or use Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend/nodejs
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://mongodb:27017/healify

  frontend:
    build: ./frontend
    ports:
      - "8000:8000"

volumes:
  mongodb_data:
```

Run with: `docker-compose up`

---

## Development Tips

1. **Hot Reload:** Use `nodemon` for Node.js development
2. **API Documentation:** Use Swagger/OpenAPI for API docs
3. **Testing:** Write unit tests with Jest or Pytest
4. **Logging:** Implement structured logging with Winston/Python logging
5. **Error Handling:** Use centralized error handling middleware
6. **Rate Limiting:** Implement rate limiting for API protection
7. **Validation:** Validate all incoming data
8. **Security:** Use environment variables for secrets

---

## Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL
- [ ] Setup database backups
- [ ] Configure email service
- [ ] Enable rate limiting
- [ ] Setup monitoring and logging
- [ ] Configure CDN for static assets
- [ ] Setup CI/CD pipeline
- [ ] Test all API endpoints
- [ ] Load testing
- [ ] Security audit

---

For more help, refer to individual backend README files.
