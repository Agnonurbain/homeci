# Security Configuration Guide

This document outlines the security configurations that have been applied and those that require manual configuration in the Supabase Dashboard.

## Applied via Migration

### 1. Fixed Multiple Permissive Policies
The `property_images` table had overlapping policies that could cause security warnings. This has been resolved by:
- Splitting the `FOR ALL` policy into separate `INSERT`, `UPDATE`, and `DELETE` policies
- Keeping the `SELECT` policy independent
- Ensuring no policy overlap for authenticated users

### 2. Fixed Function Search Path Mutability
The following functions now have immutable search paths set to `public`:
- `record_failed_login()`
- `record_successful_login()`

This prevents potential security issues from search path manipulation.

### 3. Optimized RLS Auth Function Caching
All RLS policies now use `(select auth.uid())` instead of `auth.uid()` to cache authentication results:
- This forces PostgreSQL to evaluate the auth function once per query instead of once per row
- Dramatically improves query performance at scale
- Particularly important for the `property_images` table policies
- Maintains identical security while optimizing execution

### 4. Database Indexes
Multiple indexes have been created for performance optimization:
- Properties table: owner, city, type, status, price, created_at
- Bookings table: user_id, property_id
- Messages table: sender_id, receiver_id, property_id
- Favorites table: user_id, property_id
- Login attempts table: email, user_id
- Profiles table: locked_until
- Admin tables: various indexes for efficient querying

**Note**: These indexes may show as "unused" initially but will be utilized as the application scales and queries are executed.

## Required Manual Configuration in Supabase Dashboard

### 1. Auth DB Connection Strategy (Recommended)

**Current State**: Fixed connection count (10 connections)

**Recommended Change**: Percentage-based connection allocation

**Steps**:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find **Connection Pooling** settings
4. Change Auth connection strategy from fixed count to **percentage-based**
5. Recommended: Set to 10-20% of available connections
6. Click **Save**

**Why**: Percentage-based allocation automatically scales with your instance size, improving Auth server performance as you grow.

### 2. Enable Leaked Password Protection (Critical)

**Current State**: Disabled

**Recommended Change**: Enable password breach detection

**Steps**:
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies**
3. Find **Password Requirements** section
4. Enable **"Check for breached passwords"**
5. This uses the HaveIBeenPwned.org API to prevent compromised passwords
6. Click **Save**

**Why**: Prevents users from using passwords that have been exposed in data breaches, significantly improving account security.

## Security Best Practices Already Implemented

1. **Row Level Security (RLS)**: Enabled on all tables with comprehensive policies optimized for performance
2. **RLS Performance Optimization**: Auth functions cached using subqueries for efficient execution at scale
3. **Authentication**: Supabase Auth with email/password
4. **Account Locking**: Automatic lockout after 5 failed login attempts (30 minutes)
5. **Login Tracking**: All login attempts (successful and failed) are logged with IP and user agent
6. **Admin Access Control**: Multi-level admin roles (super_admin, admin, notaire)
7. **Secure Functions**: All privileged functions use `SECURITY DEFINER` with immutable search paths
8. **Data Validation**: Type-safe database schema with proper constraints
9. **Access Logging**: Login history and admin actions are tracked

## Monitoring Recommendations

1. **Login Attempts**: Regularly review the `login_attempts` table for suspicious activity
2. **Locked Accounts**: Monitor `profiles.locked_until` for accounts experiencing attacks
3. **Admin Actions**: Track admin credential requests and changes
4. **Index Usage**: After production deployment, review index usage and optimize as needed

## Next Steps

1. Complete the manual dashboard configurations listed above
2. Test the authentication flow thoroughly
3. Set up monitoring and alerting for security events
4. Consider implementing rate limiting at the application level for API endpoints
5. Regular security audits of RLS policies and user access patterns
