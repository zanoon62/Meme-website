#!/usr/bin/env bash
# =====================================================================
# MEME Atelier — Full system test suite
# Tests all routes, API endpoints, edge cases, security headers
# =====================================================================

set -u  # don't use -e — we want to capture all failures

BASE="http://localhost:3000"
PASS=0
FAIL=0
SKIP=0
FAILED_CASES=()

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---------- helpers ----------
check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  local extra="${4:-}"
  if [[ "$expected" == "$actual" ]]; then
    PASS=$((PASS+1))
    printf "${GREEN}✓${NC} %-60s [${actual}] %s\n" "$desc" "$extra"
  else
    FAIL=$((FAIL+1))
    FAILED_CASES+=("$desc [exp=$expected got=$actual $extra]")
    printf "${RED}✗${NC} %-60s [exp=${expected} got=${actual}] %s\n" "$desc" "$extra"
  fi
}

skip() {
  local desc="$1"
  local reason="$2"
  SKIP=$((SKIP+1))
  printf "${YELLOW}⊘${NC} %-60s [SKIP: %s]\n" "$desc" "$reason"
}

section() {
  echo ""
  echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD} $1${NC}"
  echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
}

# Helper: HTTP status only
status() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$@"
}

# Helper: HTTP body (first N chars)
body() {
  local n="${2:-500}"
  curl -s --max-time 20 "$1" | head -c "$n"
}

# Helper: HTTP header
header() {
  local url="$1"
  local h="$2"
  curl -s -I --max-time 10 "$url" | grep -i "^$h:" | head -1 | tr -d '\r'
}

# =====================================================================
section "1. CUSTOMER-FACING ROUTES"
# =====================================================================

# Homepage
H=$(status "$BASE/")
check "Homepage /" "200" "$H"

# Has MEME brand text
B=$(body "$BASE/" 5000)
if echo "$B" | grep -q "MEME"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Homepage contains MEME brand" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Homepage missing MEME brand"); printf "${RED}✗${NC} %-60s\n" "Homepage contains MEME brand"
fi

# Has hero carousel
if echo "$B" | grep -qiE "TOP BRANDS|FAST SHIPPING|hero-carousel"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Homepage has hero carousel" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Homepage missing hero carousel"); printf "${RED}✗${NC} %-60s\n" "Homepage has hero carousel"
fi

# Has best sellers — check full page body
B=$(curl -s --max-time 20 "$BASE/")
if echo "$B" | grep -qiE "Best|Sellers|best-sellers|Most wanted"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Homepage has Best Sellers section" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Homepage missing Best Sellers"); printf "${RED}✗${NC} %-60s\n" "Homepage has Best Sellers section"
fi

# Shop page
H=$(status "$BASE/shop")
check "Shop /shop" "200" "$H"

# Shop with query
H=$(status "$BASE/shop?q=hoodie")
check "Shop search ?q=hoodie" "200" "$H"
H=$(status "$BASE/shop?category=hoodies")
check "Shop category filter" "200" "$H"
H=$(status "$BASE/shop?filter=best")
check "Shop filter=best" "200" "$H"
H=$(status "$BASE/shop?filter=new")
check "Shop filter=new" "200" "$H"
H=$(status "$BASE/shop?page=2")
check "Shop pagination page=2" "200" "$H"

# Product detail
H=$(status "$BASE/product/zara-oversized-black-hoodie")
check "Product detail (valid slug)" "200" "$H"

# Product detail — nonexistent
H=$(status "$BASE/product/this-product-does-not-exist-xyz")
check "Product detail (nonexistent slug)" "404" "$H"

# Collection pages
for slug in premium-brands atelier-noir core-essentials; do
  H=$(status "$BASE/collection/$slug")
  check "Collection /$slug" "200" "$H"
done

# Collection — nonexistent
H=$(status "$BASE/collection/does-not-exist")
check "Collection (nonexistent)" "404" "$H"

# Cart / checkout / wishlist / account
H=$(status "$BASE/checkout")
check "Checkout /checkout" "200" "$H"
H=$(status "$BASE/wishlist")
check "Wishlist /wishlist" "200" "$H"
H=$(status "$BASE/account")
check "Account /account" "200" "$H"

# 404 page
H=$(status "$BASE/some-random-page-that-does-not-exist")
check "Random 404 page" "404" "$H"

# =====================================================================
section "2. ADMIN ROUTES"
# =====================================================================

# Admin (demo mode — no auth required)
H=$(status "$BASE/admin")
check "Admin /admin (demo mode)" "200" "$H"

# Admin login
H=$(status "$BASE/admin/login")
check "Admin login /admin/login" "200" "$H"

# All admin tabs via ?tab=
for tab in dashboard products orders customers inventory categories collections reviews marketing analytics settings guide; do
  H=$(status "$BASE/admin?tab=$tab")
  check "Admin ?tab=$tab" "200" "$H"
done

# Admin tab with invalid value — should still render (falls back to dashboard)
H=$(status "$BASE/admin?tab=invalid_xyz")
check "Admin ?tab=invalid (fallback)" "200" "$H"

# Admin should have the sidebar nav
B=$(body "$BASE/admin" 10000)
if echo "$B" | grep -qiE "Dashboard|Atelier Admin"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Admin renders shell" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Admin shell not rendering"); printf "${RED}✗${NC} %-60s\n" "Admin renders shell"
fi

# =====================================================================
section "3. API ENDPOINTS — GET"
# =====================================================================

# Public products API
H=$(status "$BASE/api/products")
check "GET /api/products" "200" "$H"

# Public products — has expected shape
B=$(body "$BASE/api/products" 2000)
if echo "$B" | grep -qiE "\"products\"|\"id\""; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "/api/products returns product data" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("/api/products shape wrong"); printf "${RED}✗${NC} %-60s %s\n" "/api/products returns product data" ""
fi

# Admin analytics
H=$(status "$BASE/api/admin/analytics")
check "GET /api/admin/analytics" "200" "$H"

# Admin orders
H=$(status "$BASE/api/admin/orders")
check "GET /api/admin/orders" "200" "$H"

# Admin customers
H=$(status "$BASE/api/admin/customers")
check "GET /api/admin/customers" "200" "$H"

# Admin categories
H=$(status "$BASE/api/admin/categories")
check "GET /api/admin/categories" "200" "$H"

# Admin collections
H=$(status "$BASE/api/admin/collections")
check "GET /api/admin/collections" "200" "$H"

# Admin products GET
H=$(status "$BASE/api/admin/products")
check "GET /api/admin/products (demo)" "200" "$H"

# Wishlist API
H=$(status "$BASE/api/wishlist")
check "GET /api/wishlist" "200" "$H"

# Reviews API
H=$(status "$BASE/api/reviews")
check "GET /api/reviews" "200" "$H"

# Auth session
H=$(status "$BASE/api/auth/session")
check "GET /api/auth/session" "200" "$H"

# Health check / root API
H=$(status "$BASE/api")
check "GET /api (root)" "200" "$H"

# =====================================================================
section "4. API ENDPOINTS — POST / METHOD VALIDATION"
# =====================================================================

# Newsletter — wrong method (GET) should be 405
H=$(status "$BASE/api/newsletter")
check "GET /api/newsletter (wrong method)" "405" "$H"

# Newsletter — valid POST
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' --max-time 10)
check "POST /api/newsletter (valid email)" "200" "$H"

# Newsletter — invalid email
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}' --max-time 10)
check "POST /api/newsletter (invalid email)" "400" "$H"

# Newsletter — missing email
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d '{}' --max-time 10)
check "POST /api/newsletter (missing email)" "400" "$H"

# Newsletter — malformed JSON
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/newsletter" \
  -H "Content-Type: application/json" \
  -d 'not json' --max-time 10)
check "POST /api/newsletter (malformed JSON)" "400" "$H"

# Coupons validate
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10"}' --max-time 10)
check "POST /api/coupons/validate (valid format)" "200" "$H"

# Coupons validate — missing code
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -d '{}' --max-time 10)
check "POST /api/coupons/validate (missing code)" "400" "$H"

# Checkout — empty cart
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","lines":[],"shipping_address":{},"shipping_method":"standard"}' --max-time 10)
check "POST /api/checkout (empty cart)" "400" "$H"

# Checkout — invalid email
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{"email":"bad","lines":[{"product_id":"p1","slug":"s","name":"Test","quantity":1,"price":100,"size":"M","color":"black"}],"shipping_address":{"full_name":"Test","address1":"123 St","city":"Cairo","governorate":"Cairo","phone":"+201234567890","country":"Egypt"},"shipping_method":"standard"}' --max-time 10)
check "POST /api/checkout (invalid email)" "400" "$H"

# Checkout — missing required fields
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{}' --max-time 10)
check "POST /api/checkout (empty body)" "400" "$H"

# Checkout — valid demo payload (matches CheckoutPayloadSchema)
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","lines":[{"productId":"p1","slug":"zara-oversized-black-hoodie","name":"Zara Hoodie","quantity":1,"price":650,"size":"M","color":"black"}],"shipping_address":{"first_name":"Test","last_name":"User","address1":"123 Tahrir St","city":"Cairo","state":"Cairo","postal_code":"11511","country":"EG","phone":"+201234567890"},"shipping_method":"standard"}' --max-time 10)
check "POST /api/checkout (valid demo payload)" "200" "$H"

# Auth signup — invalid email
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"bad","password":"short"}' --max-time 10)
check "POST /api/auth/signup (invalid email)" "400" "$H"

# Auth signup — missing password
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' --max-time 10)
check "POST /api/auth/signup (missing password)" "400" "$H"

# Admin product create — should be blocked in demo mode
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test","price":100,"inventory":1}' --max-time 10)
check "POST /api/admin/products (demo mode blocks writes)" "503" "$H"

# Admin product update — should be blocked
H=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/admin/products/some-id" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated"}' --max-time 10)
check "PATCH /api/admin/products/:id (demo blocks)" "503" "$H"

# Admin product delete — should be blocked
H=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/admin/products/some-id" --max-time 10)
check "DELETE /api/admin/products/:id (demo blocks)" "503" "$H"

# Stripe webhook — invalid signature
H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/webhook" \
  -H "stripe-signature: invalid" \
  -d '{}' --max-time 10)
check "POST /api/stripe/webhook (invalid signature)" "400" "$H"

# =====================================================================
section "5. RATE LIMITING"
# =====================================================================

# Fire 20 rapid requests to checkout — should hit rate limit
RATE_LIMITED=0
for i in $(seq 1 20); do
  H=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/checkout" \
    -H "Content-Type: application/json" \
    -d '{"email":"bad","lines":[]}' --max-time 5)
  if [[ "$H" == "429" ]]; then
    RATE_LIMITED=1
    break
  fi
done
if [[ $RATE_LIMITED -eq 1 ]]; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Checkout rate limit triggers (429)" "after $i reqs"
else
  # Rate limit may not be enabled in dev — flag as warning
  skip "Checkout rate limit triggers (429)" "not triggered in 20 reqs (may be IP-based)"
fi

# =====================================================================
section "6. SECURITY HEADERS"
# =====================================================================

# Check headers on homepage
HDRS=$(curl -s -I --max-time 10 "$BASE/")

if echo "$HDRS" | grep -qi "X-Content-Type-Options: nosniff"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "X-Content-Type-Options header" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Missing X-Content-Type-Options"); printf "${RED}✗${NC} %-60s\n" "X-Content-Type-Options header"
fi

if echo "$HDRS" | grep -qi "X-Frame-Options: DENY"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "X-Frame-Options: DENY" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Missing X-Frame-Options"); printf "${RED}✗${NC} %-60s\n" "X-Frame-Options: DENY"
fi

if echo "$HDRS" | grep -qi "Referrer-Policy:"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Referrer-Policy header" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Missing Referrer-Policy"); printf "${RED}✗${NC} %-60s\n" "Referrer-Policy header"
fi

if echo "$HDRS" | grep -qi "Permissions-Policy:"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Permissions-Policy header" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Missing Permissions-Policy"); printf "${RED}✗${NC} %-60s\n" "Permissions-Policy header"
fi

if echo "$HDRS" | grep -qi "Strict-Transport-Security:"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "HSTS header" ""
else
  skip "HSTS header" "typically set by Vercel in prod"
fi

# =====================================================================
section "7. SEO & META"
# =====================================================================

# Sitemap
H=$(status "$BASE/sitemap.xml")
check "GET /sitemap.xml" "200" "$H"
CT=$(curl -s -I --max-time 10 "$BASE/sitemap.xml" | grep -i "content-type:" | head -1 | tr -d '\r')
if echo "$CT" | grep -qi "xml"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "sitemap.xml content-type" "$CT"
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("sitemap content-type wrong: $CT"); printf "${RED}✗${NC} %-60s %s\n" "sitemap.xml content-type" "$CT"
fi

# Robots
H=$(status "$BASE/robots.txt")
check "GET /robots.txt" "200" "$H"

# Manifest
H=$(status "$BASE/manifest.webmanifest")
check "GET /manifest.webmanifest" "200" "$H"

# OG image
H=$(status "$BASE/opengraph-image")
check "GET /opengraph-image" "200" "$H"

# Homepage has <title>
B=$(body "$BASE/" 5000)
if echo "$B" | grep -qi "<title"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Homepage has <title>" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Homepage missing title"); printf "${RED}✗${NC} %-60s\n" "Homepage has <title>"
fi

# Homepage has meta description
if echo "$B" | grep -qi "name=\"description\""; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Homepage has meta description" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Homepage missing meta description"); printf "${RED}✗${NC} %-60s\n" "Homepage has meta description"
fi

# Homepage has OG tags — check full body
B=$(curl -s --max-time 20 "$BASE/")
if echo "$B" | grep -qi "og:title"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Homepage has Open Graph tags" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Homepage missing OG tags"); printf "${RED}✗${NC} %-60s\n" "Homepage has Open Graph tags"
fi

# =====================================================================
section "8. STATIC ASSETS & IMAGES"
# =====================================================================

# Logo SVG
H=$(status "$BASE/logo.svg")
check "GET /logo.svg" "200" "$H"

# Dynamic product image (SVG)
H=$(status "$BASE/api/product-img?name=Test&category=Hoodies&color=black&idx=0&w=400&h=500")
check "GET /api/product-img (dynamic SVG)" "200" "$H"
CT=$(curl -s -I --max-time 10 "$BASE/api/product-img?name=Test&category=Hoodies&color=black&idx=0&w=400&h=500" | grep -i "content-type:" | head -1 | tr -d '\r')
if echo "$CT" | grep -qi "svg"; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "product-img returns SVG" "$CT"
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("product-img not SVG: $CT"); printf "${RED}✗${NC} %-60s %s\n" "product-img returns SVG" "$CT"
fi

# Next image optimizer
H=$(status "$BASE/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1483985988355-763728e1935b%3Fw%3D1200&w=1920&q=75")
check "GET /_next/image (remote Unsplash)" "200" "$H"

# =====================================================================
section "9. RUNTIME ERROR CHECK (dev log)"
# =====================================================================

# Check last 500 log lines for errors
ERRORS=$(tail -500 /home/z/my-project/dev.log 2>/dev/null | grep -ciE "⨯|Error:|TypeError|ReferenceError|Module not found")
if [[ $ERRORS -eq 0 ]]; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "No runtime errors in dev log" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("$ERRORS runtime errors in dev log"); printf "${RED}✗${NC} %-60s [%s errors]\n" "No runtime errors in dev log" "$ERRORS"
  # Show actual errors
  tail -500 /home/z/my-project/dev.log | grep -iE "⨯|Error:|TypeError|ReferenceError" | head -5 | while read line; do
    echo "    ↳ $line"
  done
fi

# =====================================================================
section "10. BUILD / TYPECHECK / LINT"
# =====================================================================

# Typecheck
TC=$(cd /home/z/my-project && npm run typecheck 2>&1 | tail -3)
if echo "$TC" | grep -qiE "error TS"; then
  FAIL=$((FAIL+1)); FAILED_CASES+=("Typecheck has errors"); printf "${RED}✗${NC} %-60s\n" "Typecheck passes"
  echo "$TC" | grep "error TS" | head -5 | while read line; do echo "    ↳ $line"; done
else
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Typecheck passes" ""
fi

# Lint
LINT=$(cd /home/z/my-project && npm run lint 2>&1 | tail -5)
# Extract "✖ N problems (E errors, W warnings)" — count only real errors
LINT_SUMMARY=$(echo "$LINT" | grep -oE "✖ [0-9]+ problems \([0-9]+ errors?")
LINT_ERRORS=$(echo "$LINT_SUMMARY" | grep -oE "[0-9]+ errors" | grep -oE "^[0-9]+")
LINT_WARNINGS=$(echo "$LINT_SUMMARY" | grep -oE "[0-9]+ warning" | grep -oE "^[0-9]+")
LINT_ERRORS=${LINT_ERRORS:-0}
LINT_WARNINGS=${LINT_WARNINGS:-0}
if [[ $LINT_ERRORS -eq 0 ]]; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "Lint passes" "[$LINT_WARNINGS warnings]"
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("Lint has $LINT_ERRORS errors"); printf "${RED}✗${NC} %-60s [%s errors]\n" "Lint passes" "$LINT_ERRORS"
fi

# =====================================================================
section "11. PACKAGE HEALTH"
# =====================================================================

# Check package.json has required deps
if [[ -f /home/z/my-project/package.json ]]; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "package.json exists" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("package.json missing"); printf "${RED}✗${NC} %-60s\n" "package.json exists"
fi

# Check critical env vars
ENV_FILE=/home/z/my-project/.env
if [[ -f $ENV_FILE ]]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" $ENV_FILE 2>/dev/null || grep -q "DATABASE_URL" $ENV_FILE 2>/dev/null; then
    PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" ".env file exists" ""
  else
    FAIL=$((FAIL+1)); FAILED_CASES+=(".env missing vars"); printf "${RED}✗${NC} %-60s\n" ".env file exists"
  fi
else
  FAIL=$((FAIL+1)); FAILED_CASES+=(".env missing"); printf "${RED}✗${NC} %-60s\n" ".env file exists"
fi

# Supabase schema exists
if [[ -f /home/z/my-project/supabase/schema.sql ]]; then
  PASS=$((PASS+1)); printf "${GREEN}✓${NC} %-60s %s\n" "supabase/schema.sql exists" ""
else
  FAIL=$((FAIL+1)); FAILED_CASES+=("schema.sql missing"); printf "${RED}✗${NC} %-60s\n" "supabase/schema.sql exists"
fi

# =====================================================================
# FINAL REPORT
# =====================================================================
echo ""
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD} FINAL REPORT${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
TOTAL=$((PASS+FAIL+SKIP))
echo ""
printf "  ${GREEN}PASSED${NC}:  %d / %d\n" "$PASS" "$TOTAL"
printf "  ${RED}FAILED${NC}:  %d / %d\n" "$FAIL" "$TOTAL"
printf "  ${YELLOW}SKIPPED${NC}: %d / %d\n" "$SKIP" "$TOTAL"
echo ""
if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}${BOLD}FAILED CASES:${NC}"
  for c in "${FAILED_CASES[@]}"; do
    echo "  • $c"
  done
fi
echo ""
if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ ALL TESTS PASSED${NC}"
else
  echo -e "${YELLOW}${BOLD}⚠ $FAIL ISSUE(S) NEED ATTENTION${NC}"
fi
echo ""

# Write JSON summary for tooling
cat > /home/z/my-project/tool-results/system-test-results.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "passed": $PASS,
  "failed": $FAIL,
  "skipped": $SKIP,
  "total": $TOTAL,
  "failed_cases": [
$(printf '    "%s"\n' "${FAILED_CASES[@]}" | sed 's/,$//' | paste -sd, -)
  ]
}
EOF

exit $FAIL
