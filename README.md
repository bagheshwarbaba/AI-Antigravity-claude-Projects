# Money Manager - E-Payment Comparison Platform

This is a modern full-stack web application designed to help users intelligently manage and compare their payment methods (UPI, Credit Cards, Debit Cards, Net Banking, E-Wallets). The platform features an AI-powered financial dashboard overview and a smart comparison engine to find the best payment method based on your preferences.

## Tech Stack
- **Frontend**: React, React Router, Vite, Axios, Chart.js, jsPDF
- **Backend**: Node.js, Express, jsonwebtoken, bcryptjs, @google/genai

## Prerequisites
- Node.js installed

## Setup Instructions

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository_url>
   cd Money_manager
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

## Configuration (Important)

To enable the AI Analyst Verdict and AI Financial Dashboard Overview, you must add your Google Gemini API key.

1. Navigate to the `backend` directory.
2. Open or create the `.env` file (`backend/.env`).
3. Add your Gemini API Key to the file:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
   *Note: If you don't add an API key, the application will still work using strict mathematical calculations, but dynamic AI insights will be disabled.*

## Running the Application

**Start the Backend Server**:
```bash
cd backend
npm run dev
```

**Start the Frontend Client** (in a new terminal):
```bash
cd frontend
npm run dev
```

Access the frontend via `http://localhost:5173`.

## Features
- **User Authentication**: Secure JWT-based login and registration.
- **Manage Payment Methods**: Add, edit, delete, and rate your payment methods.
- **Smart Comparison Engine**: Compare selected payment methods across multiple attributes (security, speed, availability, rewards, reliability, and fees).
- **AI Insights**: Provides personalized, LLM-generated insights on your overall financial readiness and the absolute best payment method for your specific criteria.
- **PDF Export**: Generate a full PDF report of your payment methods from the dashboard.
- **History Tracking**: Saves previous comparisons for easy reference.
