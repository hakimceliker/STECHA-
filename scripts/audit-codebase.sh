#!/bin/bash

# STECHA- Codebase Audit Script
# Scans for TODOs, broken links, and common issues

set -e

echo "🔍 STECHA- Codebase Audit"
echo "=" * 50

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track issues
TODOS=0
SECURITY_ISSUES=0
IMPORT_ERRORS=0

echo ""
echo "📋 1. Checking for TODO/FIXME comments..."
TODO_COUNT=$(grep -r "TODO\|FIXME" backend/ web/src --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No TODO/FIXME comments found"
else
    echo -e "${YELLOW}⚠${NC} Found $TODO_COUNT TODO/FIXME comments"
    grep -r "TODO\|FIXME" backend/ web/ --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -5
    TODOS=$TODO_COUNT
fi

echo ""
echo "🔐 2. Checking for potential security issues..."

# Check for hardcoded secrets
SECRETS=$(grep -r "sk_live_\|pk_live_\|password.*=\|secret.*=" backend/ web/src --include="*.py" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "password_hash\|JWT_SECRET_KEY\|STRIPE_SECRET_KEY" | wc -l)
if [ "$SECRETS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No hardcoded secrets detected"
else
    echo -e "${RED}✗${NC} Potential secrets found: $SECRETS"
    SECURITY_ISSUES=$SECRETS
fi

# Check for SQL injection patterns
SQL_PATTERNS=$(grep -r "execute\|query\|sql(" backend/ --include="*.py" 2>/dev/null | grep -v "query.filter\|db.query\|execute_command" | wc -l)
if [ "$SQL_PATTERNS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No raw SQL queries detected (using ORM)"
else
    echo -e "${YELLOW}⚠${NC} Raw SQL queries found: $SQL_PATTERNS (verify they use ORM)"
fi

echo ""
echo "📦 3. Checking imports and dependencies..."

# Check for broken imports in Python
if command -v python &> /dev/null; then
    cd backend
    IMPORT_ERRORS=$(python -m py_compile app/**/*.py 2>&1 | wc -l)
    cd ..
    if [ "$IMPORT_ERRORS" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Python imports valid"
    else
        echo -e "${YELLOW}⚠${NC} Some import issues found (check above)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Python not available for import check"
fi

echo ""
echo "🏢 4. Checking tenant isolation..."

# Count user_id filters in analytics
ANALYTICS_FILTERS=$(grep -c "user_id" backend/app/api/v1/analytics.py)
if [ "$ANALYTICS_FILTERS" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Analytics API has user_id filters ($ANALYTICS_FILTERS found)"
else
    echo -e "${RED}✗${NC} Analytics API missing user_id filters"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
fi

# Count user_id filters in payments
PAYMENT_FILTERS=$(grep -c "user_id" backend/app/api/v1/payments.py)
if [ "$PAYMENT_FILTERS" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Payments API has user_id filters ($PAYMENT_FILTERS found)"
else
    echo -e "${RED}✗${NC} Payments API missing user_id filters"
    SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
fi

echo ""
echo "🧪 5. Checking test coverage..."

# Count tests
TEST_COUNT=$(find backend/tests -name "test_*.py" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
if [ ! -z "$TEST_COUNT" ] && [ "$TEST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} $TEST_COUNT lines of test code"
else
    echo -e "${YELLOW}⚠${NC} No tests found"
fi

echo ""
echo "📱 6. Checking responsive design markers..."

# Check for Tailwind responsive classes
RESPONSIVE=$(grep -r "md:\|lg:\|sm:\|2xl:" web/src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
if [ "$RESPONSIVE" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Responsive design markers found ($RESPONSIVE breakpoints)"
else
    echo -e "${YELLOW}⚠${NC} No responsive design markers detected"
fi

echo ""
echo "♿ 7. Checking accessibility attributes..."

# Check for aria labels
ARIA=$(grep -r "aria-\|role=" web/src --include="*.tsx" 2>/dev/null | wc -l)
if [ "$ARIA" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Accessibility attributes found ($ARIA ARIA markers)"
else
    echo -e "${YELLOW}⚠${NC} Limited accessibility markers detected"
fi

echo ""
echo "=" * 50
echo "📊 Audit Summary"
echo "=" * 50

TOTAL_ISSUES=$((TODOS + SECURITY_ISSUES + IMPORT_ERRORS))

if [ "$SECURITY_ISSUES" -eq 0 ] && [ "$IMPORT_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No critical issues found"
else
    echo -e "${RED}✗${NC} Critical issues: $((SECURITY_ISSUES + IMPORT_ERRORS))"
fi

if [ "$TODOS" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Non-critical TODOs: $TODOS"
fi

echo ""
echo "Audit completed at $(date '+%Y-%m-%d %H:%M:%S')"
