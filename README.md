<div align="center">

# 🍆 TalongGuard

### An Intelligent Eggplant Disease Diagnostic Rover Equipped with Portable Imaging System

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=flat-square&logo=sqlite)](https://sql.js.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*A thesis project submitted in partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Engineering*

**Nueva Ecija, Philippines · 2026**

</div>

---

## 📖 About

**TalongGuard** is an intelligent eggplant disease diagnostic rover equipped with a portable imaging system that autonomously scans crops, detects leaf diseases using computer vision and AI, and maps outbreak locations in real time — helping Filipino farmers protect their harvest and reduce crop losses.

This web-based dashboard serves as the monitoring and data management interface for the rover system, allowing agriculturists to:

- 📍 **View scan sessions** on an interactive GPS map
- 🔬 **Identify detected diseases** by location, date, and type
- 📊 **Analyze trends** through charts and detection records
- 👥 **Manage agriculturist accounts** with role-based access

---

## 🎯 Detected Diseases

| Disease | Description |
|---|---|
| 🟢 Healthy Leaf | No disease detected |
| 🟤 Insect Pest Disease | Damage caused by insect infestation |
| 🟠 Leaf Spot Disease | Fungal or bacterial leaf spot |
| 🟡 Mosaic Virus | Viral mosaic pattern on leaves |
| ⬜ White Mold Disease | Fungal white mold infection |
| 🟣 Wilt Disease | Vascular wilt causing plant collapse |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Tailwind CSS | Styling and responsive design |
| React Leaflet | Interactive GPS disease mapping |
| Chart.js / Recharts | Disease distribution and timeline charts |
| React Router | Client-side navigation |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| sql.js (SQLite) | Lightweight embedded database |
| JSON Web Tokens | Secure authentication |
| bcryptjs | Password hashing |
| Nodemailer + Gmail | Email notifications and verification |

---

## 📁 Project Structure

```
talongguard/
│
├── frontend/                   # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx        # Landing page
│       │   ├── Dashboard.jsx   # Main disease map & records
│       │   ├── DiseaseGuide.jsx
│       │   ├── About.jsx
│       │   ├── Login.jsx
│       │   ├── ManageUsers.jsx # Admin user management
│       │   ├── ChangePassword.jsx
│       │   └── ForgotPassword.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── Toast.jsx
│       ├── data/data.js        # Disease config & sample data
│       └── api.js              # API client
│
└── server/                     # Node.js + Express backend
    ├── index.js                # Server entry point
    ├── db.js                   # Database setup (sql.js)
    ├── email.js                # Email service (Nodemailer)
    ├── middleware/
    │   └── authMiddleware.js   # JWT authentication
    └── routes/
        ├── auth.js             # Login, password reset
        └── users.js            # User management (admin)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

### 1. Clone the repository

```bash
git clone https://github.com/Kanashii23/talongguard.git
cd talongguard
```

### 2. Set up the backend

```bash
cd server
```

Create a `.env` file (copy from `.env.example`):

```bash
copy .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3001
JWT_SECRET=your_secret_key_here

GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx

ADMIN_EMAIL=admin@talonggaurd.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=System Administrator
```

Install dependencies and start:

```bash
npm install
npm run dev
```

✅ Server runs at `http://localhost:3001`

### 3. Set up the frontend

Open a second terminal:

```bash
cd talongguard
npm install
npm run dev
```

✅ App runs at `http://localhost:5173`

---

## 🔐 Authentication

| Role | Access |
|---|---|
| **Admin** | Full access — manage users, view all records, edit data |
| **Agriculturist** | View dashboard, scan sessions, disease records |

### Default Admin Credentials
```
Email:    admin@talonggaurd.com
Password: admin123
```
> ⚠️ Change this immediately after first login via your `.env` file before the first run.

### Creating a New Account (Admin only)
1. Log in as Admin → click **Manage Users** in the navbar
2. Click **Create Account**
3. Fill in 4 steps: Personal Info → Location → Email Verification → Password
4. A 6-digit verification code is sent to the new user's email
5. Account is created and a welcome email is sent

---

## 📧 Gmail App Password Setup

Required to send verification and welcome emails:

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Search **"App passwords"** → Generate for **Mail**
4. Copy the 16-character code → paste into `.env` as `GMAIL_APP_PASSWORD`

---

## 📱 Responsive Design

TalongGuard is fully responsive across all devices:

- **Mobile** (iPhone/Android) — slide-in filter drawer, compact stats, touch-friendly
- **Tablet** (iPad) — side-by-side charts, expanded sessions list
- **Desktop** — persistent sidebar, full table with all columns

---

## 🔄 Development Commands

```bash
# Frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build

# Backend
npm run dev        # Start with nodemon (auto-restart)
npm start          # Start without nodemon
```

---

## 📸 Screenshots

> *Dashboard with GPS disease mapping, scan sessions, and detection records*

---

## 👥 Authors

Developed as a thesis project at **Nueva Ecija, Philippines (2026)**

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with 💚 for Filipino eggplant farmers</p>
  <p>🍆 TalongGuard · Nueva Ecija, Philippines · 2026</p>
</div>