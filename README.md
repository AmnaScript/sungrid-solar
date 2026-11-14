# SunGrid Solar — Staff Portal Auth & Order Data Foundation

A staff-only solar installation order tracking application built with **React, TypeScript, Node.js, Express, MySQL, bcrypt, and JWT**.

This repository covers the initial authentication and order-data foundation for SunGrid Solar. Staff accounts can sign in and access installation orders through a role-protected API. A simple React login page and orders list are part of the Task 1 brief and must be completed and verified before the task is submitted.

## Tech Stack

- **Frontend:** React + TypeScript (Vite), Axios
- **Backend:** Node.js, Express, TypeScript
- **Database:** MySQL 8, `mysql2/promise`
- **Authentication:** bcrypt password hashing, JSON Web Tokens (JWT)
- **Validation and protection:** Zod, Helmet, login rate limiting, CORS

## Project Structure

```text
sungrid-solar/
├── backend/
│   ├── database/
│   │   └── schema.sql
│   ├── src/
│   │   ├── config/db.ts
│   │   ├── middleware/auth.ts
│   │   ├── routes/auth.ts
│   │   ├── routes/orders.ts
│   │   ├── scripts/bootstrapAdmin.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
└── README.md
```

## Database Schema

The `backend/database/schema.sql` file creates the `sungrid_solar` database and two tables:

- **`users`**: `id`, `name`, `email`, `password_hash`, `role` (`staff` or `admin`). New user records default to `staff`.
- **`orders`**: `id`, `customer_name`, `address`, `status`, `created_at`. MySQL automatically sets `created_at` using `CURRENT_TIMESTAMP`.

The schema can be initialized in MySQL Workbench by opening and executing `backend/database/schema.sql` while connected as an administrator.

## Local Setup

### Prerequisites

- Node.js and npm
- MySQL Server 8 and MySQL Workbench (optional GUI)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/sungrid-solar.git
cd sungrid-solar
```

Replace `YOUR_USERNAME` with the GitHub repository owner.

### 2. Initialize MySQL

Open `backend/database/schema.sql` in MySQL Workbench and execute the script. Create a separate application user with appropriate privileges rather than running the application as MySQL `root`:

```sql
CREATE USER 'sungrid_app'@'localhost' IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON sungrid_solar.* TO 'sungrid_app'@'localhost';
```

If the account already exists, use `ALTER USER ... IDENTIFIED BY ...` to change its password instead of repeating `CREATE USER`.

### 3. Configure environment variables

Create `backend/.env` (do **not** commit it):

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=sungrid_app
DB_PASSWORD=YOUR_APP_DATABASE_PASSWORD
DB_NAME=sungrid_solar
JWT_SECRET=YOUR_LONG_RANDOM_JWT_SECRET
ADMIN_NAME=SunGrid Administrator
ADMIN_EMAIL=admin@sungrid.example
ADMIN_PASSWORD=YOUR_STRONG_INITIAL_ADMIN_PASSWORD
```

Generate a random signing key with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Install, build, and start the backend

```bash
cd backend
npm install
npm run build
npm run bootstrap:admin
npm run dev
```

The admin bootstrap runs only during initial setup. It creates the initial admin account if the configured email does not already exist. Remove `ADMIN_PASSWORD` from your environment after use. The API runs at `http://localhost:5000` by default.

Check `http://localhost:5000/api/health` to confirm the server is running.

### 5. Start the frontend (once implemented)

```bash
cd frontend
npm install
npm run dev
```

The local Vite frontend uses `http://localhost:5173`. Before submission, verify that the login form sends credentials to `/api/login`, stores the returned token in `localStorage` as specified by the brief, and fetches `/api/orders` with `Authorization: Bearer <token>`. Do not use real customer information in a demonstration.

## API Endpoints

| Method | Route | Access | Successful result |
| --- | --- | --- | --- |
| GET | `/api/health` | Public health check | `200` and status JSON |
| POST | `/api/login` | Valid staff/admin credentials | `200`, JWT and user info |
| POST | `/api/register` | Admin JWT only | `201`, new staff user |
| GET | `/api/orders` | Staff JWT only | `200`, JSON array of orders |

### Registration body

```json
{
  "name": "Test Staff",
  "email": "staff@sungrid.example",
  "password": "StaffTest2026!"
}
```

The API assigns the `staff` role server-side. It does not accept a self-selected role.

### Login body

```json
{
  "email": "staff@sungrid.example",
  "password": "StaffTest2026!"
}
```

A successful login returns a signed JWT in the `token` property. Incorrect existing-account credentials return `401`. Invalidly formatted request bodies return a validation error (`400`).

### Request protected orders

```http
GET /api/orders
Authorization: Bearer YOUR_STAFF_JWT
```

The response is an order array (`[]` if no orders exist). A missing, invalid, expired, or unauthorized token returns `403` as required by the task review criteria. An admin token does not qualify for the staff-only orders route.

## Security Decisions

### Why JWT instead of server-side sessions?

JWT enables the API to verify signed authentication claims without keeping a server-side session record for each browser. Each token has a two-hour expiration. A token is not treated as sufficient authorization on its own: the API also checks the user's current role in MySQL for every protected request. This means a signed token belonging to a user who no longer has the required role is rejected. This design does add a database query per protected request.

### Password protection

Passwords are hashed using bcrypt with a work factor of 12 before storage; plaintext passwords are never stored in the `users` table or included in login responses.

### Roles and authorization

Only an authenticated `admin` can call `/api/register`. New accounts always receive the `staff` role assigned by the server/database, never a role supplied in the request body. The JWT includes the user's ID (subject) and role. The middleware verifies its signature, expiration, expected role, and the user's current role in MySQL. The `/api/orders` route is restricted specifically to `staff`.

### Input validation and SQL injection prevention

Zod validates registration and login inputs, including required fields, valid email format, and minimum password length. MySQL queries use parameter placeholders (`?`) through `mysql2.execute()` rather than assembling SQL strings from user input. The API does not trust client-supplied user IDs or roles for authorization. Validation and parameterized queries are complementary controls: input validation alone does not prevent SQL injection.

### API and configuration safeguards

Helmet sets security-related HTTP headers, the login endpoint is rate-limited, CORS is restricted to the local development frontend, and JSON bodies have a size limit. Database credentials, JWT secrets, and initial administrator credentials are kept in `.env` and excluded from version control. The database connection uses a dedicated limited-privilege account.

### Frontend token storage caveat

The task brief explicitly requests saving the JWT in `localStorage`. This meets the trial's implementation instructions, but `localStorage` tokens can be accessed by injected JavaScript in an XSS attack. For a production deployment containing customer data, secure `HttpOnly`, `Secure`, `SameSite` cookies and a corresponding CSRF strategy should be evaluated.

## Task 1 Verification Checklist

Run the API locally and verify these **before submitting**:

- [ ] `POST /api/login` with correct staff credentials returns **200** and a JWT.
- [ ] `POST /api/login` with incorrect credentials returns **401**.
- [ ] `GET /api/orders` without valid staff authorization returns **403**.
- [ ] `GET /api/orders` with valid staff authorization returns **200** and a JSON array.
- [ ] React login works, saves the token, and displays fetched orders.
- [ ] README contains a `Security Decisions` section.
- [ ] Repository is **public** and contains at least **three meaningful Git commits**.
- [ ] No `.env`, credentials, real customer data, or other secrets have been committed.

## Task 2 / Task 3 (Not Part of This Submission)

Task 2 adds order-status updates and an `order_logs` audit trail using MySQL transactions. Task 3 covers deployment, handover documentation, and a short demo recording. Those features should not be presented as complete during Task 1 submission.
