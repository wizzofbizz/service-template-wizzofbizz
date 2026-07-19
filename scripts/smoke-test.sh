#!/usr/bin/env bash
#
# End-to-end smoke test.
#
# Exercises the flows that matter — public site, login, dashboard, booking,
# quoting, payments config — against a running instance. Run it after any
# significant change, and after every deploy.
#
#   ./scripts/smoke-test.sh                      # defaults to localhost:5000
#   BASE_URL=https://client.co.za ./scripts/smoke-test.sh
#
# Exits non-zero if anything fails, so it can gate a deploy.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
EMAIL="${SMOKE_EMAIL:-demo@example.com}"
PASSWORD="${SMOKE_PASSWORD:-LocalDevPassword123}"
COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT

pass=0
fail=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    printf "  \033[32m✓\033[0m %-46s %s\n" "$label" "$actual"
    pass=$((pass + 1))
  else
    printf "  \033[31m✗\033[0m %-46s got %s, expected %s\n" "$label" "$actual" "$expected"
    fail=$((fail + 1))
  fi
}

# --max-time guards against a slow response being reported as a failure (000)
# when the machine is busy, e.g. during a concurrent Docker build.
code() { curl -s -o /dev/null --max-time 30 -w "%{http_code}" "$@"; }

echo "Smoke test against $BASE_URL"
echo

echo "Public site"
check "homepage"                 200 "$(code "$BASE_URL/")"
check "booking mode"             200 "$(code "$BASE_URL/api/public/booking-mode")"
check "services"                 200 "$(code "$BASE_URL/api/public/services/current")"
check "availability"             200 "$(code "$BASE_URL/api/public/current/availability")"
check "payment status"           200 "$(code "$BASE_URL/api/public/payments/status")"
check "feature flags"            200 "$(code "$BASE_URL/api/config/features")"

echo
echo "Authentication"
check "wrong password rejected"  401 "$(code -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' -d '{"email":"'"$EMAIL"'","password":"definitely-wrong"}')"
check "login"                    200 "$(code -c "$COOKIES" -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' -d '{"email":"'"$EMAIL"'","password":"'"$PASSWORD"'"}')"
check "dashboard needs auth"     401 "$(code "$BASE_URL/api/dashboard/stats")"

echo
echo "Dashboard (authenticated)"
for ep in auth/me dashboard/stats contacts quotes jobs invoices services; do
  check "$ep" 200 "$(code -b "$COOKIES" "$BASE_URL/api/$ep")"
done

echo
echo "Admin config"
check "payfast config status"    200 "$(code -b "$COOKIES" "$BASE_URL/api/payments/config-status")"
check "calendar status"          200 "$(code -b "$COOKIES" "$BASE_URL/api/calendar/status")"
check "formula validation"       200 "$(code -b "$COOKIES" -X POST "$BASE_URL/api/services/validate-formula" \
  -H 'Content-Type: application/json' -d '{"formula":"base_price * 2","basePrice":"100"}')"

echo
echo "Security"
check "formula endpoint gated"   401 "$(code -X POST "$BASE_URL/api/services/validate-formula" \
  -H 'Content-Type: application/json' -d '{"formula":"base_price"}')"
check "path traversal blocked"   404 "$(code "$BASE_URL/objects/..%2F..%2Fpackage.json")"
check "unknown api 404s"         404 "$(code "$BASE_URL/api/nonexistent-endpoint")"

echo
echo "Booking (creates real data)"
SERVICE_ID=$(curl -s "$BASE_URL/api/public/services/current" \
  | node -pe 'try{JSON.parse(require("fs").readFileSync(0,"utf8")).services[0].id}catch(e){""}' 2>/dev/null)

if [ -n "$SERVICE_ID" ]; then
  QUOTE=$(code -X POST "$BASE_URL/api/public/quote-request/current" \
    -H 'Content-Type: application/json' \
    -d '{"serviceId":"'"$SERVICE_ID"'","customerInput":"Smoke test request","contactInfo":{"fullName":"Smoke Test","email":"smoke@example.com"},"answers":{},"serviceLocationType":"remote"}')
  check "quote request" 201 "$QUOTE"
else
  printf "  \033[33m!\033[0m %-46s no services seeded — skipped\n" "quote request"
fi

echo
echo "─────────────────────────────────────────────────────────"
if [ "$fail" -eq 0 ]; then
  printf "\033[32m%d passed, 0 failed\033[0m\n" "$pass"
  exit 0
else
  printf "\033[31m%d passed, %d FAILED\033[0m\n" "$pass" "$fail"
  exit 1
fi
