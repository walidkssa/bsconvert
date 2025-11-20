# Rate Limiting Implementation for Free Trial API

## Overview

This implements a **comprehensive rate limiting system** to protect the `/api/free-trial-convert` endpoint from abuse and prevent excessive API quota consumption.

## Protection Layers

### 1. IP-Based Rate Limiting
- **Limit**: Maximum **3 attempts per 5 minutes** per IP address
- **Window**: Rolling 5-minute window
- **Tracking**: Uses SHA-256 hashed IPs (RGPD/GDPR compliant)
- **Storage**: PostgreSQL table `free_trial_rate_limits`

### 2. Automatic Cleanup
- Old rate limit entries (>24 hours) are automatically eligible for cleanup
- Function `cleanup_old_rate_limits()` can be called periodically

## How It Works

### Request Flow

```
1. User makes request to /api/free-trial-convert
2. Extract client IP → Hash with SHA-256
3. Check rate limit in database:
   - If NO recent attempts → Allow (1/3 attempts used)
   - If < 3 attempts in last 5 min → Allow (increment counter)
   - If ≥ 3 attempts in last 5 min → REJECT with 429 status
4. Process conversion (if allowed)
5. Record successful conversion in free_trial_ips table
```

### HTTP Response Codes

- **200**: Success
- **429**: Too Many Requests (rate limit exceeded)
  - Response includes `Retry-After` header (seconds until reset)
  - Response includes `resetAt` timestamp
- **403**: Trial limit reached (IP already used free trial)

### Example Rate Limit Response

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. You can try again in 4 minutes.",
  "remainingAttempts": 0,
  "resetAt": "2025-11-20T15:30:00.000Z"
}
```

## Database Schema

### Table: `free_trial_rate_limits`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ip_hash` | TEXT | SHA-256 hash of client IP |
| `attempt_count` | INTEGER | Number of attempts in current window |
| `first_attempt_at` | TIMESTAMPTZ | Start of current rate limit window |
| `last_attempt_at` | TIMESTAMPTZ | Most recent attempt |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

### Indexes

- `idx_rate_limits_ip_hash`: Fast lookups by IP hash
- `idx_rate_limits_created_at`: Fast cleanup of old records

## Installation

### Step 1: Create Database Table

Execute the SQL migration via **Supabase Dashboard SQL Editor**:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/create-rate-limiting-table.sql`
4. Click **Run** to execute

### Step 2: Verify Installation

Check that the table was created:

```sql
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'free_trial_rate_limits';
```

## Configuration

Rate limit settings can be adjusted in `lib/rate-limiter.ts`:

```typescript
const RATE_LIMIT_CONFIG = {
  maxAttemptsPerWindow: 3,      // Max attempts per window
  windowMinutes: 5,              // Time window in minutes
  cleanupIntervalHours: 24,      // Cleanup old entries after X hours
};
```

## Testing Rate Limiting

### Test 1: Normal Usage (Should Succeed)

```bash
# First request - should succeed
curl -X POST http://localhost:3000/api/free-trial-convert \
  -F "file=@test-statement.pdf"

# Wait 6 minutes, then try again - should succeed
```

### Test 2: Rapid Requests (Should Block)

```bash
# Make 4 requests rapidly
for i in {1..4}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/free-trial-convert \
    -F "file=@test-statement.pdf"
  echo ""
done

# Expected: First 3 succeed, 4th returns 429
```

### Test 3: Check Rate Limit Status

```sql
SELECT
  ip_hash,
  attempt_count,
  first_attempt_at,
  last_attempt_at,
  created_at
FROM free_trial_rate_limits
ORDER BY created_at DESC
LIMIT 10;
```

## Security Features

### 1. GDPR Compliance
- IPs are hashed with SHA-256 before storage
- Original IPs are NEVER stored in database
- Salt can be configured via `IP_SALT` environment variable

### 2. Fail-Open Strategy
- If database is unavailable, requests are **allowed by default**
- Prevents legitimate users from being blocked due to infrastructure issues
- Errors are logged for monitoring

### 3. HTTP Standard Compliance
- Uses standard HTTP 429 status code
- Includes `Retry-After` header (RFC 7231)
- Clear error messages for clients

## Monitoring

### View Rate Limit Activity

```sql
-- Count rate limit hits per hour
SELECT
  date_trunc('hour', created_at) as hour,
  COUNT(*) as attempts
FROM free_trial_rate_limits
WHERE created_at > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### Find Most Active IPs

```sql
SELECT
  ip_hash,
  attempt_count,
  first_attempt_at,
  last_attempt_at
FROM free_trial_rate_limits
WHERE created_at > now() - interval '1 hour'
ORDER BY attempt_count DESC
LIMIT 20;
```

## Performance Impact

- **Database queries per request**: 1-2 (SELECT + INSERT/UPDATE)
- **Query response time**: <10ms (with indexes)
- **Storage**: ~100 bytes per IP per window
- **Expected load**: <1,000 entries per day (auto-cleanup after 24h)

## Maintenance

### Manual Cleanup

To manually cleanup old entries:

```sql
DELETE FROM free_trial_rate_limits
WHERE created_at < now() - interval '24 hours';
```

### Reset Rate Limit for IP

```sql
-- Find IP hash from logs, then:
DELETE FROM free_trial_rate_limits
WHERE ip_hash = 'your_ip_hash_here';
```

## Troubleshooting

### Issue: Rate limit not working

**Check 1**: Verify table exists
```sql
SELECT * FROM free_trial_rate_limits LIMIT 1;
```

**Check 2**: Check logs for errors
```bash
# Look for "Rate limit" messages in application logs
```

**Check 3**: Verify IP extraction
```typescript
// Add logging in getClientIP() function
console.log('Client IP:', clientIP);
console.log('IP Hash:', ipHash);
```

### Issue: Users blocked incorrectly

**Solution**: Check time window calculation
```sql
-- View active rate limit windows
SELECT
  ip_hash,
  attempt_count,
  first_attempt_at,
  now() - first_attempt_at as window_age
FROM free_trial_rate_limits
WHERE now() - first_attempt_at < interval '5 minutes';
```

## Future Enhancements

Potential improvements:
1. Redis integration for high-throughput scenarios
2. Different limits per endpoint
3. Graduated rate limiting (slower after multiple blocks)
4. Whitelist for trusted IPs
5. Integration with abuse detection systems

## Related Files

- `lib/rate-limiter.ts` - Rate limiting logic
- `app/api/free-trial-convert/route.ts` - API endpoint
- `scripts/create-rate-limiting-table.sql` - Database migration
- `scripts/README-RATE-LIMITING.md` - This file
