# SnapShare - Photo Sharing Social Media App

A full-stack MERN (MongoDB, Express.js, React, Node.js) application.

## 🛠️ Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **MongoDB** (running locally or MongoDB Atlas connection)

## 📋 Setup Instructions

### **1. Clone and Navigate to Project**
```bash
git clone <your-repository-url>
cd "final project/CS110FinalProject"
```

### **2. Backend Setup**

#### **Install Dependencies**
```bash
cd Server
npm install
```

#### **Configure MongoDB**
The application is configured to connect to MongoDB. You can either:

**Option A: Use Local MongoDB**
- Install MongoDB locally
- Start MongoDB service
- The app will connect to `mongodb://localhost:27017/snapshare`

**Option B: Use MongoDB Atlas**
- Create a free MongoDB Atlas account
- Get your connection string
- Update the connection string in `Server/index.js`

#### **Start the Server**
```bash
npm start
```

The server will run on **port 3000** and connect to MongoDB.

### **3. Frontend Setup**

#### **Install Dependencies**
```bash
cd ../Client/Client
npm install
```

#### **Start Development Server**
```bash
npm run dev
```

The React app will run on **port 5173** (Vite default).

## 🌐 Accessing the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## 🔧 Development

### **Running in Development Mode**
Both frontend and backend support hot-reloading for development:

```bash
# Terminal 1 - Backend
cd Server
npm start

# Terminal 2 - Frontend
cd Client/Client
npm run dev
```

## 🚨 Troubleshooting

### **Common Issues**

#### **MongoDB Connection Error**
```bash
Error: MongoDB connection error
```
**Solution**: Ensure MongoDB is running and accessible

#### **Port Already in Use**
```bash
Error: EADDRINUSE: address already in use :::3000
```
**Solution**: Kill existing process or change port in `Server/index.js`

#### **Frontend Build Errors**
```bash
Error: Cannot find module
```
**Solution**: Run `npm install` in the `Client/Client` directory

#### **Authentication Issues**
- Clear localStorage and try logging in again
- Check server console for JWT verification errors
- Ensure email/password match during login
