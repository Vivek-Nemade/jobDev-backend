# TalentForge 

TalentForge is a full-stack job portal platform (inspired by Naukri.com) built with the **MERN** stack. It supports two primary user roles — **Jobseekers** and **Recruiters** — plus an **Admin** role for platform moderation, with secure authentication, file uploads, and a dashboard for analytics.
**_Visit [here](https://job-dev-frontend.vercel.app)._**
---

## 🚀 Features

- **Google OAuth 2.0 with Role Selection** — Users can sign up/log in via Google and choose their role (Jobseeker or Recruiter) at the time of authentication.
- **JWT Access/Refresh Token Rotation** — Secure, stateless authentication using short-lived access tokens and rotating refresh tokens stored in HTTP-only cookies.
- **Resume & Image Uploads** — Multer + Cloudinary integration for handling resume (PDF) and profile photo uploads.
- **Role-Based Access Control (RBAC)** — Route-level protection for Jobseeker, Recruiter, and Admin actions via custom middleware.
- **Job Posting & Applications**
  - Recruiters can post, update, and delete job listings.
  - Jobseekers can browse, search/filter, save, and apply to jobs with resume uploads.
  - Recruiters can view and manage applicants, updating application status.
- **Admin Job Approval System** — Jobs posted by recruiters go through an admin approval workflow before going live.
- **Admin Dashboard with Charts** — Recharts-powered analytics dashboard for platform stats (users, jobs, applications).
- **Search, Filter & Pagination** — Debounced search with dynamic MongoDB `$regex` filters, `populate()` for related data, and offset-based pagination on both frontend and backend.
- **Rate Limiting** — `express-rate-limit` applied to sensitive auth routes (login, register, password reset) to prevent brute-force attacks.

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express 5 | REST API framework |
| Mongoose | MongoDB ODM |
| Passport + passport-google-oauth20 | Google OAuth strategy |
| jsonwebtoken | Access/refresh token generation & verification |
| bcryptjs | Password hashing |
| Cloudinary | Resume & image storage |
| Multer | Multipart form-data / file upload handling |
| Nodemailer | Transactional email (OTP, password reset) |
| cookie-parser | HTTP-only cookie parsing for tokens |
| cors | Cross-origin resource sharing |
| express-rate-limit | Brute-force protection on auth routes |
| dotenv | Environment variable management |
| nodemon (dev) | Auto-restart during development |

### Frontend
| Package | Purpose |
|---|---|
| React 19 | UI library |
| Redux Toolkit + react-redux | Global auth/user state management |
| TanStack Query | Server-state management, caching, and data fetching |
| React Router DOM | Client-side routing |
| React Hook Form | Form state & validation |
| Axios | HTTP client |
| Tailwind CSS 4 | Utility-first styling |
| Recharts | Admin dashboard charts |
| React Toastify | Toast notifications |
| Vite | Build tool & dev server |

---


---

## 🔐 Authentication Flow

1. **Standard Auth**: `register → verify-otp → login` issues an access token (short-lived) and refresh token (long-lived), both set as HTTP-only cookies.
2. **Token Refresh**: `/auth/refresh` rotates the refresh token and issues a new access token, reducing the risk of long-lived token theft.
3. **Google OAuth**:
   - `/auth/google?role=jobseeker|recruiter` kicks off the OAuth flow, passing the selected role via the `state` parameter.
   - `/auth/google/callback` handles the Passport callback, generates tokens for the authenticated user, sets cookies, and redirects to the client's `/auth/callback` route.
4. **Role-Based Middleware**:
   - `protect` — verifies the JWT and attaches the user to the request.
   - `restrictedFor(...roles)` — restricts a route to specific roles (e.g., `recruiter`, `admin`).
   - `requireVerified` — ensures the user has completed email/OTP verification before performing sensitive actions (like posting or applying to jobs).

---

## 🔍 Search, Filter & Pagination

- **Frontend**: Search input is debounced (`useDebounce` hook) to avoid excessive API calls; TanStack Query handles caching, refetching, and conditional rendering of loading/empty/error states.
- **Backend**: Query params are used to dynamically build a MongoDB filter object (`$regex` for text search on job title/location/skills), `populate()` is used to join recruiter/company data, and offset-based pagination (`skip`/`limit`) returns paginated results with total counts.

---


---

## 📄 License

This project is for personal/portfolio use.
