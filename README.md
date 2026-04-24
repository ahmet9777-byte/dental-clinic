# DentaCare — Dental Clinic Management System

A full-stack web application for managing dental clinic appointments.

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 14 (App Router) · Tailwind CSS · Axios |
| Backend   | Node.js 20 · Express 4 · Sequelize 6 ORM |
| Database  | PostgreSQL 16 |
| Auth      | JWT · bcrypt |
| Email     | n8n workflow automation |

## Project Structure

```
dental-clinic/
├── backend/      # Express API
└── frontend/     # Next.js app
```

## Quick Start

### 1. Database

```bash
createdb dental_clinic
psql -U postgres -d dental_clinic -f backend/src/config/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # fill in DB credentials + JWT_SECRET
npm install
npm run seed                # optional demo data
npm run dev                 # → http://localhost:5000
```

Demo credentials after seeding:

| Role      | Email                      | Password       |
|-----------|----------------------------|----------------|
| Patient   | sara@example.com           | Patient@123    |
| Secretary | secretary@dentacare.com    | Secretary@123  |
| Doctor    | yousef@dentacare.com       | Doctor@123     |

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                 # → http://localhost:3000
```

### 4. n8n (optional — for email automation)

1. Install and start n8n: `npx n8n`
2. Create a workflow with a **Webhook** trigger
3. Set the webhook URL in `backend/.env` as `N8N_WEBHOOK_URL`
4. Build the email node using the payload fields:
   `patientName`, `patientEmail`, `doctorName`, `specialization`,
   `appointmentDate`, `timeSlot`, `condition`, `appointmentId`

## API Reference

### Auth
| Method | Endpoint                  | Access    |
|--------|---------------------------|-----------|
| POST   | /api/auth/register        | Public    |
| POST   | /api/auth/login           | Public    |
| POST   | /api/auth/staff/login     | Public    |
| GET    | /api/auth/me              | Protected |
| PATCH  | /api/auth/me              | Protected |
| PATCH  | /api/auth/me/password     | Protected |

### Doctors
| Method | Endpoint                  | Access    |
|--------|---------------------------|-----------|
| GET    | /api/doctors              | Public    |
| GET    | /api/doctors/:id          | Public    |
| GET    | /api/doctors/:id/slots    | Protected |
| GET    | /api/doctor/schedule      | Doctor    |
| GET    | /api/doctor/patients      | Doctor    |

### Appointments
| Method | Endpoint                          | Access     |
|--------|-----------------------------------|------------|
| POST   | /api/appointments                 | Patient    |
| GET    | /api/appointments/my              | Patient    |
| DELETE | /api/appointments/:id             | Patient    |
| GET    | /api/appointments                 | Secretary  |
| PATCH  | /api/appointments/:id/confirm     | Secretary  |
| PATCH  | /api/appointments/:id/reject      | Secretary  |
| PATCH  | /api/appointments/:id/complete    | Sec/Doctor |
| GET    | /api/appointments/:id             | Protected  |

## Running Tests

```bash
cd backend
npm test
```

Requires a test database (`createdb dental_clinic_test`).

## User Flows

### Patient
1. Register at `/register`
2. Browse doctors and book at `/book` (4-step wizard)
3. Track appointment status at `/dashboard`
4. Receive email confirmation when secretary confirms

### Secretary
1. Log in at `/staff-login`
2. View all appointments at `/secretary/dashboard`
3. Filter by status / date / patient name
4. Confirm (triggers n8n email) or reject with reason

### Doctor
1. Log in at `/staff-login`
2. View daily schedule at `/doctor/schedule`
3. Click any appointment to see patient details
4. Mark appointments as completed
