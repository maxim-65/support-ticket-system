# Support Ticket Management System

Junior full-stack technical assessment implementation using a Node.js/Express API, MySQL, JWT authentication, and a React frontend.

## Technology stack

- Backend: Node.js, Express.js, MySQL2, JWT, bcrypt, dotenv, CORS
- Frontend: React, React Router, Axios
- Testing: Jest and Supertest
- API verification: Postman collection

## Folder structure

```text
support-ticket-system/
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── tests/
│   ├── db.js
│   ├── server.js
│   └── .env.example
├── frontend/
│   └── src/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── postman/
│   └── Support-Ticket-System.postman_collection.json
├── tests/
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js and npm
- MySQL Server and the MySQL client
- Optional: Postman (Newman is not required)

## Local setup

Install dependencies:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

Create the database and sample data:

```powershell
mysql -u root -p < database\schema.sql
mysql -u root -p support_tickets < database\seed.sql
```

Copy `backend\.env.example` to `backend\.env` and set the local MySQL credentials and a development-only JWT secret. The backend environment file is ignored by Git.

For the React app, copy `.env.example` to `frontend\.env` only if the API is not running at `http://localhost:5000/api`.

## Environment variables

Backend variables:

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
PORT
FRONTEND_URL
TEST_AGENT_PASSWORD
```

Frontend variable:

```text
REACT_APP_API_URL
```

Do not place database credentials or JWT secrets in frontend environment files.

## Start the application

Start the backend:

```powershell
cd backend
npm start
```

Start the frontend in another terminal:

```powershell
cd frontend
npm start
```

The API runs at `http://localhost:5000` and the React app runs at `http://localhost:3000`.

## Automated tests

With MySQL running and `backend\.env` configured:

```powershell
cd backend
npm test
```

The Jest/Supertest suite exercises authentication, ticket ownership, agent authorization, comments, and ticket search/filter/sort behavior against the database.

`TEST_AGENT_PASSWORD` is required locally because the integration suite logs in with the seeded agent account. Keep it only in the ignored `backend\.env` file.

## Postman API verification

Collection location:

`postman\Support-Ticket-System.postman_collection.json`

The collection uses `{{baseUrl}}`, whose default value is `http://localhost:5000/api`. Before running the collection, set these variables to local test credentials:

- `customerEmail`, `customerPassword`
- `customerBEmail`, `customerBPassword`
- `agentEmail`, `agentPassword`
- `newCustomerEmail`

Successful login requests save `customerToken`, `customerBToken`, and `agentToken` automatically. The collection includes health, authentication, ticket CRUD, comments, users, search/filter/sort, ownership, and role-authorization scenarios.

## API overview

### Health

- `GET /api/health`

### Authentication

- `POST /api/auth/register` - registers a customer; returns `201`
- `POST /api/auth/login` - returns a one-hour JWT and user information

### Tickets

- `GET /api/tickets` - authenticated users; customers see their own tickets, agents see all tickets
- `POST /api/tickets` - authenticated ticket creation; ownership comes from the JWT
- `GET /api/tickets/:id` - authenticated ticket details with ownership enforcement
- `PUT /api/tickets/:id` - agent-only status, priority, and assignment updates
- `DELETE /api/tickets/:id` - agent-only deletion

Supported ticket query parameters:

- `search`
- `status`: `open`, `in_progress`, `closed`
- `priority`: `low`, `medium`, `high`
- `sortBy`: `created_at`, `updated_at`, `priority`, `status`
- `sortOrder`: `asc`, `desc`

### Comments

- `GET /api/tickets/:id/comments`
- `POST /api/tickets/:id/comments`

Comment authors are always derived from the authenticated JWT.

### Users

- `GET /api/users` - agent-only list of valid agents; password fields are never returned

Authenticated requests use:

```text
Authorization: Bearer <jwt>
```

## Customer capabilities

- Register and sign in
- View their own tickets
- Search and filter their tickets
- Create tickets
- View ticket details and comments
- Add comments to their own tickets
- Sign out

## Agent capabilities

- Sign in
- View all authorized tickets
- View ticket statistics
- Search, filter, and sort tickets
- View ticket/customer details and comments
- Update status and priority
- Assign tickets to valid agents
- Add comments
- Delete tickets
- Sign out

Backend authorization remains the security boundary for every protected operation.
