# Blood Donation Platform — Server

The backend service for the Blood Donation Platform implements REST APIs for authentication, user management, donation requests, funding workflows, contact messages, and location data.

## Live deployment

- Server site: https://server-tan-three.vercel.app/

## Repository

- Server GitHub: https://github.com/shahrierbiddut/blood_donation_server

## Architecture

- Node.js + Express
- MongoDB via Mongoose
- JSON Web Tokens for authentication
- Stripe integration for payment and funding flows
- Environment-driven configuration with `dotenv`
- Validation using Zod and custom middleware

## Install and run locally

```bash
cd server
npm install
npm run dev
```

The server listens on port `5000` by default and exposes API endpoints under `/api`.

## API highlights

- `POST /api/auth/login` — user login
- `POST /api/auth/register` — user registration
- `GET /api/users` — user management
- `GET /api/donations` — donation request workflows
- `GET /api/fundings` — funding history and totals
- `POST /api/contacts` — contact messages
- `GET /api/location/*` — location data lookup
- `POST /api/stripe/create-session` — Stripe checkout session creation

## Scripts

- `npm run dev` — start development server
- `npm run start` — start production server
- `npm run seed` — seed sample donation data
- `npm run seed-admin` — seed an admin user

## Environment variables

Create a `.env` file with the following variables:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — JWT access token secret
- `JWT_REFRESH_SECRET` — JWT refresh token secret
- `JWT_EXPIRE` — access token expiry (default: `7d`)
- `JWT_REFRESH_EXPIRE` — refresh token expiry (default: `30d`)
- `CORS_ORIGIN` — allowed front-end origin
- `APP_URL` — base application URL
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook secret

## Notes for maintainers

- `server.js` initializes middleware, routes, and error handling.
- `config/db.js` connects to MongoDB and configures DNS options.
- `config/jwt.js` manages JWT creation and verification.
- Controllers handle domain logic for auth, donations, funding, contacts, and location.
- Middleware validates request payloads and protects authenticated routes.

## Demo accounts

- Volunteer: `sadia@gmail.com` / `Test@12345`
- Admin: `rahim@gmail.com` / `Test@12345`
- Donor: `akashislam@gmail.com` / `Test@12345`
