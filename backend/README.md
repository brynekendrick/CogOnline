# Barangay Backend (Spring Boot + Supabase)

## 1. Supabase
Run `sql/schema.sql` in Supabase > SQL Editor.

## 2. IntelliJ environment variables (Run > Edit Configurations > Environment variables)
DB_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
DB_USER=postgres.<your-project-ref>
DB_PASSWORD=<your database password>
JWT_SECRET=<any random string, 32+ characters>

(Copy the exact host/user from Supabase > Connect > Session pooler.)

## 3. Run
Open this folder in IntelliJ as a Maven project, then run BarangayApplication.
API runs at http://localhost:8080

## Endpoints
POST /api/auth/register  -> 201 | 409 EMAIL_EXISTS / PHONE_EXISTS / USERNAME_EXISTS
POST /api/auth/login     -> 200 {token, user} | 401
POST /api/auth/logout    -> 200
GET  /api/auth/me        -> 200 user | 401   (Authorization: Bearer <token>)
