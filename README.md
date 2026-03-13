# IT Equipment Borrowing System

> A full-stack web application for managing IT equipment loans within an organization. Built with **FastAPI** and **React**, it streamlines the entire borrowing lifecycle -- from employee self-service requests to admin inventory tracking, overdue detection, and automated email reminders.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Employees borrow equipment through a **4-step wizard** (or QR code scan), while IT admins get a full **dashboard** with real-time inventory levels, transaction history, overdue alerts, and Excel/PDF export. A background scheduler automatically flags overdue items and sends email reminders -- no manual intervention needed.

## Features

### Employee (User) Features
- **Quick Borrow Form** - 4-step wizard to borrow equipment in under 30 seconds
- **NIK Auto-Lookup** - Enter employee ID to auto-fill name, department, and email
- **Multi-Item Selection** - Borrow multiple items in a single session
- **Flexible Dates** - Choose return date or number of borrowing days
- **Borrowing History** - Look up past and current borrowing records
- **QR Code Access** - Scan a QR code to open the borrowing page instantly
- **Mobile-Friendly** - Responsive design works on any device

### Admin (IT Department) Features
- **Dashboard** - Overview stats: active borrows, overdue items, inventory levels
- **Inventory Management** - Add, edit, and manage equipment stock levels
- **Transaction Records** - Full borrow/return history with filters and search
- **Overdue Tracking** - Automatic detection and highlighting of overdue items
- **Email Reminders** - Manual and automatic reminder emails to borrowers
- **Export Reports** - Download transactions as Excel or PDF
- **QR Code Generator** - Generate QR codes for easy system access

### Automated Features
- **Daily Overdue Check** - Scheduled job detects and flags overdue items
- **Email Reminders** - Automatic reminders 1 day before and on return date
- **Stock Validation** - Prevents over-borrowing with real-time stock checks

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite, Tailwind CSS, React Router, Axios, Lucide Icons |
| **Backend** | Python FastAPI, SQLAlchemy ORM, Pydantic v2 |
| **Database** | SQLite (default) / PostgreSQL (production) |
| **Email** | SMTP via aiosmtplib, Jinja2 HTML templates |
| **Scheduler** | APScheduler (background overdue checker) |
| **Export** | OpenPyXL (Excel), ReportLab (PDF) |
| **QR Code** | python-qrcode library |
| **Deployment** | Docker + Docker Compose, Nginx |

---

## Project Structure

```
it-borrowing-system/
|
|-- backend/
|   |-- app/
|   |   |-- __init__.py
|   |   |-- config.py              # Environment settings (Pydantic)
|   |   |-- database.py            # SQLAlchemy engine & session
|   |   |-- models.py              # Database models (Employee, Item, Transaction)
|   |   |-- schemas.py             # Pydantic request/response schemas
|   |   |-- main.py                # FastAPI app with CORS, routers, lifespan
|   |   |-- routers/
|   |   |   |-- auth.py             # Admin login & token management
|   |   |   |-- employees.py        # Employee NIK lookup
|   |   |   |-- items.py            # Equipment CRUD operations
|   |   |   |-- borrowing.py        # Borrow/return endpoints
|   |   |   |-- admin.py            # Dashboard, filters, export, reminders
|   |   |-- services/
|   |   |   |-- email_service.py    # SMTP email sending
|   |   |   |-- scheduler_service.py # APScheduler overdue checker
|   |   |   |-- qrcode_service.py   # QR code generation
|   |   |   |-- export_service.py   # Excel & PDF export
|   |   |-- templates/
|   |       |-- reminder_email.html # Reminder email template
|   |       |-- overdue_email.html  # Overdue email template
|   |-- seed_data.py               # Initial data seeder
|   |-- requirements.txt
|   |-- Dockerfile
|   |-- .env.example
|
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |   |-- client.js           # Axios instance with auth interceptor
|   |   |-- contexts/
|   |   |   |-- AuthContext.jsx     # Admin authentication state
|   |   |-- components/
|   |   |   |-- Layout.jsx          # Page layout wrapper
|   |   |   |-- Navbar.jsx          # Navigation bar
|   |   |   |-- LoadingSpinner.jsx  # Loading indicator
|   |   |   |-- StatusBadge.jsx     # Colored status badge
|   |   |   |-- ItemSelector.jsx    # Multi-item selection with quantity
|   |   |   |-- DatePicker.jsx      # Date input with defaults
|   |   |   |-- ConfirmModal.jsx    # Confirmation dialog
|   |   |   |-- Toast.jsx           # Notification toast
|   |   |-- pages/
|   |   |   |-- BorrowPage.jsx      # Main borrowing wizard (4 steps)
|   |   |   |-- ConfirmationPage.jsx # Post-submission confirmation
|   |   |   |-- HistoryPage.jsx     # Borrowing history lookup
|   |   |   |-- admin/
|   |   |       |-- LoginPage.jsx    # Admin login
|   |   |       |-- DashboardPage.jsx # Admin dashboard
|   |   |       |-- InventoryPage.jsx # Equipment management
|   |   |       |-- TransactionsPage.jsx # Transaction records
|   |   |       |-- OverduePage.jsx  # Overdue item tracking
|   |   |-- main.jsx                # App entry point
|   |   |-- App.jsx                 # Routes configuration
|   |   |-- index.css               # Tailwind imports + custom styles
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   |-- index.html
|   |-- nginx.conf
|   |-- Dockerfile
|
|-- docker-compose.yml
|-- .gitignore
|-- README.md
```

---

## Quick Start

### Option 1: Docker (Recommended)

The easiest way to run the entire system:

```bash
# Clone the repository
git clone <repository-url>
cd it-borrowing-system

# (Optional) Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your SMTP settings

# Start both services
docker-compose up --build

# Access the application:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
- Create the SQLite database automatically
- Seed default equipment items (12 types)
- Seed sample employees (10 mock entries)
- Create default admin user
- Start the overdue checker scheduler

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL (optional - defaults to http://localhost:8000)
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Configuration

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./borrowing.db` | Database connection string |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | - | SMTP username/email |
| `SMTP_PASSWORD` | - | SMTP password or app password |
| `SMTP_FROM` | `IT Department <it@company.com>` | Sender email display |
| `APP_URL` | `http://localhost:5173` | Frontend URL (for QR codes) |
| `API_URL` | `http://localhost:8000` | Backend API URL |
| `SECRET_KEY` | `change-this-secret-key` | Token signing key |
| `ADMIN_USERNAME` | `admin` | Default admin username |
| `ADMIN_PASSWORD` | `admin123` | Default admin password |

### Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

### Email Setup (Gmail Example)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account > Security > App passwords
3. Generate an app password for "Mail"
4. Use your Gmail address as `SMTP_USER` and the app password as `SMTP_PASSWORD`

---

## API Reference

Full interactive API documentation is available at `http://localhost:8000/docs` (Swagger UI).

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees/{nik}` | Look up employee by NIK |
| `GET` | `/api/items` | List all available equipment |
| `POST` | `/api/borrow` | Submit a borrow request |
| `GET` | `/api/borrow/{id}` | Get transaction details |
| `GET` | `/api/borrow/history/{nik}` | Get employee's borrow history |
| `PUT` | `/api/borrow/{id}/return` | Mark equipment as returned |
| `GET` | `/api/qrcode?url=` | Generate QR code PNG |

### Admin Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login |
| `GET` | `/api/auth/me` | Verify admin token |
| `GET` | `/api/admin/dashboard` | Dashboard statistics |
| `GET` | `/api/admin/transactions` | List transactions (with filters) |
| `GET` | `/api/admin/overdue` | List overdue items |
| `POST` | `/api/admin/remind/{id}` | Send reminder email |
| `GET` | `/api/admin/export/excel` | Export to Excel |
| `GET` | `/api/admin/export/pdf` | Export to PDF |
| `POST` | `/api/items` | Add new equipment |
| `PUT` | `/api/items/{id}` | Update equipment |
| `DELETE` | `/api/items/{id}` | Soft-delete equipment |

### Example: Submit a Borrow Request

```json
POST /api/borrow
{
  "nik": "10001001",
  "borrow_date": "2026-03-13",
  "return_date": "2026-03-16",
  "items": [
    { "item_id": 1, "quantity": 2 },
    { "item_id": 8, "quantity": 1 }
  ],
  "notes": "For conference room setup"
}
```

---

## Default Data

### Sample Employees (Mock Data)

The system comes with 10 pre-loaded employees for testing:

| NIK | Name | Department |
|-----|------|------------|
| 10001001 | Budi Santoso | IT |
| 10001002 | Siti Rahayu | Finance |
| 10001003 | Ahmad Hidayat | Marketing |
| 10001004 | Dewi Lestari | HR |
| 10001005 | Rizky Pratama | Engineering |
| ... | ... | ... |

### Default Equipment Inventory

| Item | Stock | Category |
|------|-------|----------|
| Monitor | 20 | Display |
| PC/Laptop | 15 | Computer |
| USB Drive | 50 | Storage |
| Converter | 30 | Adapter |
| Mouse | 40 | Peripheral |
| Keyboard | 35 | Peripheral |
| VGA Cable | 25 | Cable |
| HDMI Cable | 25 | Cable |
| Speaker | 10 | Audio |
| Camera | 8 | Recording |
| Ladder | 5 | Tools |
| Projector | 6 | Display |

### Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

> **Important:** Change these credentials in production by setting `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables.

---

## User Guide

### Borrowing Equipment (Employee)

1. **Open the app** at `http://localhost:5173/borrow` or scan the QR code
2. **Enter your NIK** (Employee ID) and click "Look Up" - your info auto-fills
3. **Select items** - browse available equipment, click to add, set quantities
4. **Choose dates** - pick your borrow and return dates
5. **Review and submit** - confirm everything looks correct
6. **Done!** - you'll see a confirmation with your transaction ID

### Checking Borrowing History

1. Go to `http://localhost:5173/history`
2. Enter your NIK
3. View all your current and past borrowing records

### Admin Operations

1. Go to `http://localhost:5173/admin/login`
2. Log in with admin credentials
3. **Dashboard** - see overview statistics and recent activity
4. **Inventory** - manage equipment stock (add, edit, delete)
5. **Transactions** - view all records, filter by status/department/date, mark returns
6. **Overdue** - see overdue items, send individual or bulk reminders
7. **Export** - download transaction reports as Excel or PDF

---

## Application Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Redirects to /borrow | Public |
| `/borrow` | Borrow Equipment Form | Public |
| `/confirmation/:id` | Submission Confirmation | Public |
| `/history` | Borrowing History | Public |
| `/admin/login` | Admin Login | Public |
| `/admin/dashboard` | Admin Dashboard | Admin |
| `/admin/inventory` | Inventory Management | Admin |
| `/admin/transactions` | Transaction Records | Admin |
| `/admin/overdue` | Overdue Items | Admin |

---

## Database Schema

```
+──────────────+     +──────────────────+     +──────────────+
|   employees  |     | borrow_transactions|    |    items     |
+──────────────+     +──────────────────+     +──────────────+
| nik (PK)     |<--->| id (PK)          |     | id (PK)      |
| name         |     | nik (FK)         |     | item_name    |
| department   |     | borrow_date      |     | total_stock  |
| email        |     | return_date      |     | available    |
| created_at   |     | actual_return    |     | category     |
+──────────────+     | status           |     | is_active    |
                     | notes            |     +──────────────+
                     | created_at       |            ^
                     +──────────────────+            |
                            |                       |
                            v                       |
                     +──────────────────+            |
                     | borrow_details   |            |
                     +──────────────────+            |
                     | id (PK)          |            |
                     | transaction_id(FK)|           |
                     | item_id (FK)     |────────────+
                     | quantity         |
                     +──────────────────+

+──────────────+
| admin_users  |
+──────────────+
| id (PK)      |
| username     |
| password_hash|
| created_at   |
+──────────────+
```

---

## Production Deployment Tips

1. **Change default credentials** - Update `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SECRET_KEY`
2. **Use PostgreSQL** - Change `DATABASE_URL` to a PostgreSQL connection string
3. **Configure SMTP** - Set up real email credentials for reminders to work
4. **Use HTTPS** - Add SSL termination via reverse proxy (Nginx/Caddy)
5. **Set CORS properly** - Restrict `allow_origins` in `main.py` to your domain
6. **Employee API** - Replace the mock employee lookup in `employees.py` with your real HR system/API
7. **Backup database** - Set up regular SQLite/PostgreSQL backups

---

## License

Internal company tool - proprietary and confidential.
