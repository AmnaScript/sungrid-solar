JWT Authentication
JWT is used for stateless authentication, allowing the API to verify signed tokens without maintaining server-side session records. Tokens expire after two hours. The application verifies the token signature and checks the user's current role against MySQL before granting access.
Password Security
Passwords are hashed with bcrypt before storage. Plain-text passwords are never saved in the database or returned in API responses.
Role-Based Access Control
Only administrators can register staff accounts. New accounts receive the staff role from the backend. The /api/orders endpoint requires a valid staff JWT and confirms the user's current database role. Missing or invalid authorization returns HTTP 403.
Input Validation and SQL Injection Prevention
Zod validates incoming registration and login data. Database queries use parameterized statements with MySQL2 rather than interpolating user input into SQL strings.
Secrets and Environment Variables
Database credentials and JWT signing secrets are stored in environment variables and excluded from version control. The application uses a dedicated database account instead of the MySQL root user.
Frontend Token Handling
The initial React implementation will use localStorage as required by the project brief. This introduces exposure to cross-site scripting attacks, so a production version should consider short-lived tokens and secure HttpOnly cookies.