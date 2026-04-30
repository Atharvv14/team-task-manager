# ⚡ TaskFlow — Team Task Manager

A full-stack, production-grade team task management application with role-based access control, Kanban boards, real-time dashboards, and one-click Railway deployment.

![TaskFlow](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20PostgreSQL-7C6EFA?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-2DD4A0?style=flat-square)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 **Authentication** | JWT-based signup/login, secure bcrypt hashing, persistent sessions |
| 👥 **Role-Based Access** | Admin (full control) and Member roles per project |
| 📁 **Project Management** | Create, edit, delete projects with color labels |
| 🗂️ **Team Members** | Invite by email, assign roles, remove members |
| ✅ **Task Management** | Create, assign, update, delete tasks with priority & due dates |
| 📋 **Kanban Board** | Visual To Do → In Progress → Review → Done columns |
| 📊 **Dashboard** | Stats, charts (donut + bar), overdue & due-soon lists |
| ⚠️ **Overdue Detection** | Automatic overdue flagging without cron jobs |
| 🔍 **Filters** | Filter tasks by status and priority |
| 📱 **Responsive** | Mobile-first, works on all screen sizes |

---

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js 20 + Express.js
- **ORM**: Prisma (PostgreSQL)
- **Auth**: JWT + bcryptjs
- **Validation**: express-validator

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (custom design system)
- **Charts**: Recharts
- **Routing**: React Router v6
- **HTTP**: Axios
- **Fonts**: Syne + DM Sans + JetBrains Mono

### Database
- **PostgreSQL** (via Railway plugin)

---

## 🚀 Deploy to Railway (Step-by-Step)

### Prerequisites
- [Railway account](https://railway.app) (free tier works)
- [GitHub account](https://github.com) (to push the code)
- [Git](https://git-scm.com/) installed locally

---

### Step 1 — Push code to GitHub

```bash
# In the team-task-manager/ folder:
git init
git add .
git commit -m "Initial commit: TaskFlow app"

# Create a GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git branch -M main
git push -u origin main
```

---

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select your `team-task-manager` repository
4. Railway will auto-detect the Node.js app

---

### Step 3 — Add PostgreSQL database

1. In your Railway project dashboard, click **+ New**
2. Select **Database → PostgreSQL**
3. Railway will provision the database and make `DATABASE_URL` available automatically

---

### Step 4 — Set environment variables

In Railway → your app service → **Variables**, add:

```
JWT_SECRET=<generate a random 32+ char string>
```

> `DATABASE_URL` and `PORT` are set automatically by Railway.  
> You can generate a secret with: `openssl rand -hex 32`

---

### Step 5 — Run database migrations

In Railway → your service → **Deploy** tab → open a **Railway Shell** or use the CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Run migrations
railway run npx prisma migrate deploy

# (Optional) Seed demo data
railway run node prisma/seed.js
```

---

### Step 6 — Deploy!

Railway automatically deploys on every push to `main`. Your app will be live at:

```
https://your-app-name.up.railway.app
```

---

## 💻 Local Development

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
npm install
cd frontend && npm install && cd ..
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your local PostgreSQL URL and a JWT secret
```

### 3. Set up database

```bash
# Push schema to your database
npx prisma db push

# (Optional) Seed demo data
node prisma/seed.js
```

### 4. Run development servers

```bash
# Terminal 1 — Backend (port 3001)
npm run dev

# Terminal 2 — Frontend (port 5173, proxies /api to 3001)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
team-task-manager/
├── src/
│   ├── index.js              # Express server entry point
│   ├── middleware/
│   │   └── auth.js           # JWT + RBAC middleware
│   └── routes/
│       ├── auth.js           # POST /api/auth/{signup,login,me}
│       ├── projects.js       # CRUD + member management
│       ├── tasks.js          # Task CRUD with permission checks
│       ├── dashboard.js      # Aggregated stats endpoint
│       └── users.js          # User search endpoint
├── prisma/
│   ├── schema.prisma         # Database models
│   └── seed.js               # Demo data seeder
├── frontend/
│   └── src/
│       ├── api/client.js     # Axios instance + API helpers
│       ├── context/          # React context (Auth)
│       ├── components/       # Layout, TaskModal
│       └── pages/            # Dashboard, Projects, ProjectDetail, Profile
├── railway.toml              # Railway deployment config
├── nixpacks.toml             # Build configuration
└── .env.example              # Environment template
```

---

## 🔐 Role-Based Access Control

| Action | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| View project | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ | ✅ |
| Delete any task | ✅ | ✅ | ❌ |
| Add members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

---

## 🎯 API Reference

### Auth
```
POST   /api/auth/signup      Register new user
POST   /api/auth/login       Login
GET    /api/auth/me          Get current user
PATCH  /api/auth/profile     Update profile
```

### Projects
```
GET    /api/projects              List user's projects
POST   /api/projects              Create project
GET    /api/projects/:id          Get project + tasks + members
PUT    /api/projects/:id          Update project (Admin)
DELETE /api/projects/:id          Delete project (Owner)
POST   /api/projects/:id/members  Add member (Admin)
PATCH  /api/projects/:id/members/:userId  Update role (Admin)
DELETE /api/projects/:id/members/:userId  Remove member (Admin)
```

### Tasks
```
GET    /api/tasks/project/:id                     List tasks (filterable)
POST   /api/tasks/project/:id                     Create task
PUT    /api/tasks/project/:id/:taskId             Update task
DELETE /api/tasks/project/:id/:taskId             Delete task
```

### Dashboard
```
GET    /api/dashboard    Stats, charts data, overdue, recent activity
```

---

## 🌱 Demo Data

After seeding, you can log in with:

| Email | Password | Role |
|---|---|---|
| alice@demo.com | demo1234 | Project Owner/Admin |
| bob@demo.com | demo1234 | Member |

---

## 📄 License

MIT — free to use, modify, and distribute.
