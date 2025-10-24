# KeyGo - Personal URL Shortcuts

A complete cross-platform URL shortcut management system with web app, mobile app, and browser extension.

## 🚀 Features

- **Personal URL Shortcuts**: Create shortcuts like "google" → "https://www.google.com"
- **Smart Search**: Autocomplete suggestions and instant search
- **Cross-Platform**: Web, mobile (iOS/Android), and browser extension
- **User Authentication**: Secure JWT-based authentication
- **Dark Mode**: Toggle between light and dark themes
- **Categories**: Organize shortcuts by category
- **Usage Analytics**: Track shortcut usage and statistics
- **Bulk Operations**: Select and manage multiple shortcuts

## 📁 Project Structure

```
KeyGo/
├── frontend/              # React web application
├── backend/               # Flask API server
├── mobileApp/             # React Native mobile app
├── browserExtension/      # Chrome browser extension
└── README.md
```

## 🛠️ Quick Start

### 1. Backend (Flask API)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 2. Frontend (React Web App)
```bash
cd frontend
npm install
npm start
```

### 3. Mobile App (React Native)
```bash
cd mobileApp
npm install
npm start  # Opens Expo development server
```

### 4. Browser Extension (Chrome)
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `browserExtension` folder

## 🌐 Access Points

- **Web App**: http://localhost:3000
- **API**: http://localhost:5000
- **Mobile**: Scan QR code with Expo Go app
- **Extension**: Click extension icon or press `Ctrl+Shift+K`

## 💾 Database Setup

Requires PostgreSQL running on:
- **Host**: localhost
- **Port**: 5432
- **User**: postgres
- **Password**: toor
- **Database**: postgres