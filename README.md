# SmartCanteen

A college canteen ordering application built with React, Vite, Express, and MySQL. Students can browse the menu, build a cart, place cash-at-pickup orders, and review order status. Administrators can manage the menu, inventory, categories, orders, and sales summaries.

## Requirements

- Node.js 20 or newer and npm
- MySQL 8.0.16 or newer (the schema uses enforced `CHECK` constraints)

## 1. Install dependencies

From the project root:

```powershell
npm install
```

## 2. Create the database

Run [`database/schema.sql`](database/schema.sql) in MySQL Workbench, or use the MySQL command-line client. For the default Windows MySQL Server 8 installation path:

```powershell
Get-Content -Raw .\database\schema.sql | & 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -u your_mysql_user -p
```

Replace `your_mysql_user` with a MySQL account that can create the database and tables. Enter its password at the prompt. If MySQL is installed elsewhere, adjust the executable path. To verify a MySQL account before configuring the app:

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -h 127.0.0.1 -u your_mysql_user -p -e "SELECT VERSION();"
```

The schema creates `smartcanteen`, all required tables and constraints, five sample categories, and sample food items. The seed statements can be run again safely; existing sample categories/items are not duplicated.

## 3. Configure environment variables

Copy the example environment file to the server package and edit it with your own MySQL account and secrets:

```powershell
Copy-Item .\.env.example .\server\.env
notepad .\server\.env
```

Generate a private JWT signing secret (copy the output into `JWT_SECRET` in `server\.env`; do not use the example placeholder):

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Required server settings:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (defaults to `4000`) |
| `CLIENT_ORIGIN` | Allowed browser origin (defaults to `http://localhost:5173`) |
| `JWT_SECRET` | Random signing secret of at least 32 characters |
| `JWT_EXPIRES_IN` | Token lifetime (defaults to `8h`) |
| `DB_HOST`, `DB_PORT` | MySQL host and port |
| `DB_USER`, `DB_PASSWORD` | MySQL account (password may be blank for a local account configured that way) |
| `DB_NAME` | Database name; use `smartcanteen` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials used only by the administrator bootstrap command |

During local development, Vite proxies same-origin `/api` requests to `http://127.0.0.1:4000`, so the frontend works whether opened as `localhost` or `127.0.0.1` and does not depend on cross-origin browser CORS. `VITE_API_URL` is optional; if set, it overrides the proxy and must be an API URL ending in `/api`. Put it in `client/.env.local` so Vite reads it. Do not put database or JWT secrets in a `VITE_` variable: frontend values are public.

Keep `server/.env` private. It is excluded by `.gitignore`.

## 4. Create an administrator account

Choose a unique email and a strong password (12–72 characters) in `server/.env`, then run:

```powershell
npm run seed:admin
```

This creates the admin account with a bcrypt hash. Re-running the command resets the configured admin account's password and name. It refuses to elevate an existing student account. Do not use example or shared credentials outside local development.

Student accounts are created through the registration form. There is no seeded student password.

## 5. Start the application

Start both Vite and Express from the root:

```powershell
npm run dev
```

- Frontend: <http://localhost:5173>
- API health check: <http://localhost:4000/api/health>

The API starts only after it successfully connects to MySQL. A successful startup prints `SmartCanteen API listening...`; if the connection fails, the backend prints the connection error and exits. After startup, check the health endpoint from PowerShell:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

It should return `status: ok`. The backend's startup database check is separate from the health endpoint.

You can also start them separately in two terminals:

```powershell
npm run dev --workspace server
npm run dev --workspace client
```

For a production frontend build and API start:

```powershell
npm run build
npm start
```

Serve the generated `client/dist` directory with your chosen static host/reverse proxy and configure `CLIENT_ORIGIN` and `VITE_API_URL` for that deployment.

## Features

- Student registration/login with bcrypt password hashing and expiring JWTs
- Server-validated menu search and category filtering; food detail, price, stock, and availability
- Persistent browser cart with quantity controls and cash-at-pickup checkout
- Server-side order pricing, stock locking/checks, and transactional order/inventory updates
- Student order history and administrator-managed order statuses
- Role-protected admin APIs, dashboard stats, daily sales, category and food management, availability and stock controls
- Transactional stock adjustments with inventory audit logs; cancellation restores stock once
- Responsive navigation, loading/empty/error states, and feedback messages

## Validation and tests

Run the frontend production build and backend API/validation tests:

```powershell
npm run build
npm test --workspace server
```

The automated API tests cover health, request validation, malformed IDs, and authentication gates without requiring MySQL. The application cannot perform registration/login, menu CRUD, reports, or order integration checks until a real MySQL server and the environment settings above are configured. With MySQL configured, start the app and verify registration, sign-in, food CRUD, and order creation from the UI; try ordering more than the available stock and verify the API returns a conflict without changing stock. Never treat a successful health response as proof the database is connected: startup performs and reports a real MySQL connection check.

To manually exercise the database-backed flows, register a student in the browser, sign in, add a menu item to the cart, place an order, and check **My orders**. Sign in with the account created by `npm run seed:admin` to edit menu items and categories, update the order status, and check the dashboard report. Try ordering more than the displayed stock and confirm checkout reports insufficient stock without creating the order.
