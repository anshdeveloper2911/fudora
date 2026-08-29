# Fudora Auth Testing

## Credentials (from /app/memory/test_credentials.md)
- Super Admin: `fudoraofficial05@gmail.com` / `Fudora@2026`
- Restaurant Admin: `royal@fudora.demo` / `Restaurant@2026`
- Customer: `customer@fudora.demo` / `Customer@2026`

## Endpoints
- POST /api/auth/register  (customer only)
- POST /api/auth/login     (all roles)
- POST /api/auth/logout
- GET  /api/auth/me

## Tokens
Bearer token returned in JSON `{token}` for header-based auth, plus httpOnly `access_token` cookie for browser flows.

## Curl examples
```bash
API=$REACT_APP_BACKEND_URL
curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
     -d '{"email":"fudoraofficial05@gmail.com","password":"Fudora@2026"}'

TOKEN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' \
        -d '{"email":"customer@fudora.demo","password":"Customer@2026"}' | jq -r .token)
curl -s $API/api/auth/me -H "Authorization: Bearer $TOKEN"
```
