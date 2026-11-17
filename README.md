
# SunGrid Solar — Staff Portal

A full-stack internal staff portal for managing solar installation
orders securely.

Built as part of my Full Stack Development internship project at
Ezitech.

## Project Overview

SunGrid Solar installs residential solar panels and needs a
centralized system to manage installation orders.

This application provides:

- Secure staff authentication
- Role-based access control
- Protected order management
- Order status updates without page reloads
- MySQL audit logging for status changes
- A responsive React dashboard

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Axios
- Lucide React
- CSS

### Backend
- Node.js
- Express.js
- TypeScript
- MySQL2
- bcrypt
- JSON Web Tokens (JWT)
- Zod
- Helmet
- Express Rate Limit

### Database
- MySQL 8

## Project Structure

```text
sungrid-solar/
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   └── 002_order_logs.sql
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── orders.ts
│   │   ├── scripts/
│   │   │   └── bootstrapAdmin.ts
│   │   └── server.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── OrdersDashboard.tsx
│   │   ├── pages/
│   │   │   └── Login.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
├── .gitignore
└── README.md
```

## Features

### 1. Staff Authentication

The application uses JWT-based authentication.

- Passwords are hashed using bcrypt.
- Staff can log in using their registered credentials.
- Login returns a signed JWT.
- Invalid credentials return HTTP 401.
- Protected orders routes require staff authorization.
- Users without valid staff authorization receive HTTP 403.

### 2. Role-Based Access Control

Two user roles are supported:

- admin
- staff

Administrators can register staff accounts through the
protected registration endpoint.

Only authenticated staff accounts can access and update
installation orders.

The backend verifies the user's current role against MySQL.

### 3. Installation Orders Dashboard

The React dashboard displays orders retrieved from the
Express API.

The table includes:

- Order ID
- Customer name
- Installation address
- Current status
- Creation date

The dashboard also displays:

- Total orders
- Active orders
- Orders in progress

### 4. Order Status Management

Staff members can update installation order statuses.

Supported statuses:

- Scheduled
- In Progress
- Completed
- Cancelled

The dashboard sends a PATCH request to the backend.

After a successful update, React updates the affected
order in state without reloading the page.

### 5. Audit Logging

Every successful status change creates a record in the
order_logs table.

Each record includes:

- id
- order_id
- user_id
- old_status
- new_status
- changed_at

The user ID is obtained from the verified authentication
context, not from the request body.

The order update and audit-log insertion run inside the
same MySQL transaction.

If either operation fails, the transaction is rolled back.

## Database Schema

### users

| Column | Description |
|--------|-------------|
| id | Primary key |
| name | Staff name |
| email | Unique email address |
| password_hash | Hashed password |
| role | User role |

### orders

| Column | Description |
|--------|-------------|
| id | Primary key |
| customer_name | Customer name |
| address | Installation location |
| status | Installation status |
| created_at | Automatically generated timestamp |

### order_logs

| Column | Description |
|--------|-------------|
| id | Primary key |
| order_id | Related installation order |
| user_id | Staff member who changed the status |
| old_status | Previous order status |
| new_status | Updated order status |
| changed_at | Automatic timestamp |

Foreign keys connect order_logs to users and orders.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Register staff (admin only) |
| POST | /api/login | Authenticate user |
| GET | /api/health | Check API status |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | Get orders (staff only) |
| PATCH | /api/orders/:id/status | Update order status (staff only) |

### Login Request

POST /api/login

```json
{
  "email": "staff@example.com",
  "password": "your-password"
}
```

Successful responses include a JWT and user information.

### Update Order Status

PATCH /api/orders/1/status

Authorization header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Request body:

```json
{
  "status": "In Progress"
}
```

The backend validates the new status, updates the database,
and creates an audit-log record.

## Local Setup

### Prerequisites

Install:

- Node.js and npm
- MySQL Server 8 or later
- MySQL Workbench (recommended)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/AmnaScript/sungrid-solar.git
cd sungrid-solar
```

### 2. Initialize the Database

Open MySQL Workbench and connect to your local server.

Execute the following files in order:

1. backend/database/schema.sql
2. backend/database/002_order_logs.sql

The first file creates the main database and tables.

The second creates the audit-log table.

Create a dedicated MySQL application user and grant it
SELECT, INSERT, UPDATE, and DELETE permissions on the
sungrid_solar database.

Use the root account only for database administration.

### 3. Configure Backend Environment Variables

Create:

backend/.env

Example configuration:

```dotenv
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=sungrid_app
DB_PASSWORD=your_database_password
DB_NAME=sungrid_solar

JWT_SECRET=replace_with_a_long_random_secret

ADMIN_NAME=SunGrid Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_initial_admin_password
```

Replace every placeholder with your own values.

Do not commit your .env file.

### 4. Start the Backend

```bash
cd backend
npm install
npm run build
npm run dev
```

Expected server:

http://localhost:5000

Health endpoint:

http://localhost:5000/api/health

### 5. Create the Initial Administrator

For a new database, configure ADMIN_NAME, ADMIN_EMAIL,
and ADMIN_PASSWORD in the backend environment.

Run:

```bash
cd backend
npm run bootstrap:admin
```

The script creates the initial administrator if the
account does not already exist.

After setup, remove ADMIN_PASSWORD from the environment.

Use the authenticated administrator account to register
staff through POST /api/register.

### 6. Configure the Frontend

Create:

frontend/.env

Add:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

### 7. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

http://localhost:5173

Log in using your registered staff credentials.

## Reset the Database

WARNING: Resetting the database permanently deletes
local staff accounts, orders, and audit history.

Only use these steps for disposable development data.

1. Back up any important data.
2. Stop the backend server.
3. Open MySQL Workbench.
4. Execute:

```sql
DROP DATABASE IF EXISTS sungrid_solar;
```

5. Run backend/database/schema.sql.
6. Run backend/database/002_order_logs.sql.
7. Verify the application's database-user permissions.
8. Configure initial administrator credentials.
9. Run npm run bootstrap:admin inside backend.
10. Register staff accounts again.
11. Restart the backend and frontend.

Never reset a production database using this procedure.

## Security Decisions

### Why JWT Instead of Server Sessions?

JWT was selected because it supports stateless API
authentication and works conveniently with the separated
React frontend and Express backend.

The server signs tokens using a secret stored in environment
variables.

JWTs expire after two hours.

For protected routes, the backend verifies the token and
checks the user's current role against MySQL.

### Password Hashing

Passwords are hashed with bcrypt before storage.

The backend never stores plain-text passwords.

During login, bcrypt compares the submitted password with
the stored hash.

### Role-Based Authorization

Only authenticated staff members can access the orders API.

The registration endpoint is restricted to administrators.

New staff accounts receive their role from the backend,
not from user-submitted input.

The backend obtains the user ID from the verified JWT
and database lookup.

### Input Validation

Zod validates incoming authentication and status-update
requests.

Invalid or missing values are rejected with appropriate
error responses.

### SQL Injection Prevention

MySQL queries use parameterized statements through MySQL2.

User-submitted values are passed as parameters instead of
being concatenated into SQL strings.

### Transaction Safety

Order status updates and their corresponding audit logs
are saved within a single database transaction.

SELECT ... FOR UPDATE locks the selected order during
the transaction to prevent conflicting writes.

If either operation fails, both changes are rolled back.

### Environment Security

Database credentials and JWT secrets are stored in
environment variables.

Sensitive configuration files are excluded from Git.

### Token Storage

The frontend uses localStorage for JWT storage as specified
in the internship project brief.

A production version should evaluate secure HttpOnly
cookies to reduce exposure to token theft through XSS.

## Testing

### Backend Checks

```bash
cd backend
npm run build
```

### Frontend Checks

```bash
cd frontend
npm run lint
npm run build
```

### Manual Acceptance Tests

1. Log in using valid staff credentials.
2. Verify that the dashboard displays orders from MySQL.
3. Select an order and change its status.
4. Confirm the status updates without a page reload.
5. Refresh the browser and check that the change persists.
6. Verify the new status in the orders table.
7. Verify a corresponding record exists in order_logs.
8. Confirm the audit entry contains the staff user ID
   and timestamp.
9. Verify unauthorized API requests are rejected.
10. Verify invalid status values are rejected.

### Audit Log Verification

Run in MySQL Workbench:

```sql
USE sungrid_solar;

SELECT
    l.id,
    l.order_id,
    l.user_id,
    u.name AS staff_name,
    l.old_status,
    l.new_status,
    l.changed_at
FROM order_logs l
JOIN users u ON u.id = l.user_id
ORDER BY l.id DESC;
```

## Project Progress

### Task 1 — Secure Staff Login & Database Setup
- MySQL schema
- JWT authentication
- bcrypt password hashing
- Protected orders API
- React login and read-only orders dashboard

### Task 2 — Protected Dashboard & Status Updates
- Order status editing
- PATCH endpoint
- MySQL transactions
- Staff audit logging
- Local setup and database reset instructions

### Task 3 — Deployment & Handover
- Production deployment
- Hosted environment configuration
- Handover guide
- Application demonstration

Task 3 is planned for the next stage of the internship
project.

## Author

Amna Sabahat

Full Stack Development Intern — Ezitech

GitHub: https://github.com/AmnaScript

LinkedIn: https://www.linkedin.com/in/amnasabahat
