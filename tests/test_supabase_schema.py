"""Tests for Supabase schema and RLS policies."""

import pytest
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session


class TestSupabaseSchema:
    """Test suite for Supabase database schema."""

    def test_users_table_exists(self, db_session: Session):
        """Verify users table exists with required columns."""
        inspector = inspect(db_session.connection())
        tables = inspector.get_table_names()
        assert 'users' in tables, "users table not found"

        columns = {col['name'] for col in inspector.get_columns('users')}
        required_cols = {'id', 'email', 'full_name', 'role', 'restaurant_id', 'created_at', 'updated_at'}
        assert required_cols.issubset(columns), f"Missing columns: {required_cols - columns}"

    def test_restaurants_table_exists(self, db_session: Session):
        """Verify restaurants table exists with required columns."""
        inspector = inspect(db_session.connection())
        tables = inspector.get_table_names()
        assert 'restaurants' in tables, "restaurants table not found"

        columns = {col['name'] for col in inspector.get_columns('restaurants')}
        required_cols = {'id', 'owner_id', 'name', 'slug', 'created_at', 'updated_at'}
        assert required_cols.issubset(columns), f"Missing columns: {required_cols - columns}"

    def test_audit_logs_table_exists(self, db_session: Session):
        """Verify audit_logs table exists."""
        inspector = inspect(db_session.connection())
        tables = inspector.get_table_names()
        assert 'audit_logs' in tables, "audit_logs table not found"

    def test_users_email_unique_constraint(self, db_session: Session):
        """Verify email uniqueness constraint on users table."""
        inspector = inspect(db_session.connection())
        constraints = inspector.get_unique_constraints('users')
        email_unique = any(
            'email' in constraint['column_names']
            for constraint in constraints
        )
        assert email_unique, "Email unique constraint not found"

    def test_restaurants_slug_unique_constraint(self, db_session: Session):
        """Verify slug uniqueness constraint on restaurants table."""
        inspector = inspect(db_session.connection())
        constraints = inspector.get_unique_constraints('restaurants')
        slug_unique = any(
            'slug' in constraint['column_names']
            for constraint in constraints
        )
        assert slug_unique, "Slug unique constraint not found"

    def test_foreign_keys_exist(self, db_session: Session):
        """Verify foreign key relationships are established."""
        inspector = inspect(db_session.connection())

        # Check users -> auth.users FK
        users_fks = inspector.get_foreign_keys('users')
        assert len(users_fks) > 0, "No foreign keys found on users table"

        # Check restaurants -> users FK
        restaurants_fks = inspector.get_foreign_keys('restaurants')
        assert len(restaurants_fks) > 0, "No foreign keys found on restaurants table"

    def test_indexes_exist(self, db_session: Session):
        """Verify important indexes are created."""
        inspector = inspect(db_session.connection())

        # Check users indexes
        users_indexes = {idx['name'] for idx in inspector.get_indexes('users')}
        assert any('email' in idx_name for idx_name in users_indexes), "Email index missing"

        # Check restaurants indexes
        restaurants_indexes = {idx['name'] for idx in inspector.get_indexes('restaurants')}
        assert any('slug' in idx_name for idx_name in restaurants_indexes), "Slug index missing"

    def test_rls_enabled(self, db_session: Session):
        """Verify RLS is enabled on tables."""
        result = db_session.execute(
            text("""
                SELECT tablename FROM pg_tables
                WHERE schemaname='public' AND tablename IN ('users', 'restaurants', 'audit_logs')
                ORDER BY tablename
            """)
        )
        tables = {row[0] for row in result}
        expected = {'users', 'restaurants', 'audit_logs'}
        assert tables == expected, f"Expected tables not found: {expected - tables}"

    def test_updated_at_trigger_exists(self, db_session: Session):
        """Verify updated_at triggers are in place."""
        result = db_session.execute(
            text("""
                SELECT trigger_name
                FROM information_schema.triggers
                WHERE trigger_name LIKE 'trigger_%_updated_at'
            """)
        )
        triggers = {row[0] for row in result}
        assert 'trigger_users_updated_at' in triggers, "Users updated_at trigger missing"
        assert 'trigger_restaurants_updated_at' in triggers, "Restaurants updated_at trigger missing"


class TestRLSPolicies:
    """Test suite for Row-Level Security policies."""

    def test_users_table_has_policies(self, db_session: Session):
        """Verify RLS policies exist on users table."""
        result = db_session.execute(
            text("""
                SELECT COUNT(*) FROM pg_policies
                WHERE tablename='users'
            """)
        )
        count = result.scalar()
        assert count > 0, "No RLS policies found on users table"

    def test_restaurants_table_has_policies(self, db_session: Session):
        """Verify RLS policies exist on restaurants table."""
        result = db_session.execute(
            text("""
                SELECT COUNT(*) FROM pg_policies
                WHERE tablename='restaurants'
            """)
        )
        count = result.scalar()
        assert count > 0, "No RLS policies found on restaurants table"

    def test_audit_logs_table_has_policies(self, db_session: Session):
        """Verify RLS policies exist on audit_logs table."""
        result = db_session.execute(
            text("""
                SELECT COUNT(*) FROM pg_policies
                WHERE tablename='audit_logs'
            """)
        )
        count = result.scalar()
        assert count > 0, "No RLS policies found on audit_logs table"

    def test_rls_policies_named_correctly(self, db_session: Session):
        """Verify policy naming convention."""
        result = db_session.execute(
            text("""
                SELECT policyname FROM pg_policies
                WHERE tablename IN ('users', 'restaurants', 'audit_logs')
                ORDER BY policyname
            """)
        )
        policy_names = {row[0] for row in result}

        # Verify key policies exist
        expected_patterns = [
            'users_can_view_own_profile',
            'users_can_update_own_profile',
            'restaurants_visible_to_authenticated',
            'owners_can_view_own_restaurant',
        ]

        for pattern in expected_patterns:
            assert any(pattern in name for name in policy_names), \
                f"Policy pattern '{pattern}' not found in: {policy_names}"


@pytest.fixture
def db_session():
    """Fixture for database session - implement with your DB setup."""
    # This fixture will be implemented when backend DB is configured
    pass
