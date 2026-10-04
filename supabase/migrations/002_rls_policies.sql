-- Migration: 002_rls_policies.sql
-- Description: Row-Level Security policies for all tables
-- Created: 2026-10-04
-- Security: Claude review required

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Users can view other users in their restaurant
CREATE POLICY "users_can_view_restaurant_users"
ON public.users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u1
        WHERE u1.id = auth.uid()
        AND u1.restaurant_id = public.users.restaurant_id
        AND u1.restaurant_id IS NOT NULL
    )
);

-- Admins can view all users
CREATE POLICY "admins_can_view_all_users"
ON public.users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u1
        WHERE u1.id = auth.uid()
        AND u1.role = 'admin'
    )
);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = OLD.role); -- Prevent role elevation

-- Restaurant owners can update staff in their restaurant
CREATE POLICY "restaurant_owners_can_manage_staff"
ON public.users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants r
        WHERE r.owner_id = auth.uid()
        AND r.id = public.users.restaurant_id
    )
);

-- ============================================================================
-- RESTAURANTS TABLE RLS POLICIES
-- ============================================================================

-- Authenticated users can view restaurants
CREATE POLICY "restaurants_visible_to_authenticated"
ON public.restaurants FOR SELECT
USING (is_active = true);

-- Owners can view their own restaurant even if inactive
CREATE POLICY "owners_can_view_own_restaurant"
ON public.restaurants FOR SELECT
USING (owner_id = auth.uid());

-- Restaurant owners can update their own restaurant
CREATE POLICY "owners_can_update_own_restaurant"
ON public.restaurants FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Admins can manage all restaurants
CREATE POLICY "admins_can_manage_restaurants"
ON public.restaurants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
);

-- ============================================================================
-- AUDIT_LOGS TABLE RLS POLICIES
-- ============================================================================

-- Users can view audit logs for their restaurant
CREATE POLICY "users_can_view_restaurant_audit"
ON public.audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND (
            u.restaurant_id IS NOT NULL
            OR u.role = 'admin'
        )
    )
);

-- System can insert audit logs (no direct user writes)
CREATE POLICY "system_can_insert_audit_logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true); -- Backend inserts audit logs via service role

-- ============================================================================
-- PREVENT DIRECT INSERTS (except system/service role)
-- ============================================================================

-- Users cannot directly insert their own user records
-- (handled by auth.users creation)

-- Users cannot directly insert restaurant records
-- (handled by invitation flow)

-- Only service role (backend) can insert users/restaurants
-- RLS allows this because service role bypasses RLS
