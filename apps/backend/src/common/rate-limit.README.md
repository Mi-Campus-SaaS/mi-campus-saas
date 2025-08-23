# Redis-Backed Distributed Rate Limiting

This module provides Redis-backed distributed rate limiting for the NestJS application with support for per-route, per-user, and per-IP quotas.

## Features

- **Distributed**: Works across multiple application instances
- **Configurable**: Environment-based configuration
- **Multiple Strategies**: User-based, IP-based, and route-based rate limiting
- **Redis Backend**: Uses Redis sorted sets for efficient rate limiting
- **Graceful Degradation**: Falls back to allowing requests if Redis is unavailable

## Configuration

Add these environment variables to configure rate limiting:

```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Default limits (requests per window)
RATE_LIMIT_DEFAULT_LIMIT=100
RATE_LIMIT_DEFAULT_WINDOW_MS=60000

# User-based rate limiting
RATE_LIMIT_USER_LIMIT=200
RATE_LIMIT_USER_WINDOW_MS=60000

# IP-based rate limiting
RATE_LIMIT_IP_LIMIT=150
RATE_LIMIT_IP_WINDOW_MS=60000

# Route-based rate limiting
RATE_LIMIT_ROUTE_LIMIT=300
RATE_LIMIT_ROUTE_WINDOW_MS=60000

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_RATE_LIMIT_DB=1
```

## Usage

### 1. Import the Rate Limit Module

```typescript
import { RateLimitModule } from '../common/rate-limit.module';

@Module({
  imports: [RateLimitModule],
  // ...
})
export class YourModule {}
```

### 2. Apply Rate Limiting to Controllers

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitUser, RateLimitIP, RateLimitRoute } from '../common/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Controller('api')
@UseGuards(RateLimitGuard)
export class ApiController {
  // User-based rate limiting (requires authentication)
  @Get('user-data')
  @RateLimitUser(10, 60000) // 10 requests per minute per user
  @UseGuards(JwtAuthGuard)
  getUserData() {
    return { data: 'user specific data' };
  }

  // IP-based rate limiting
  @Post('public-endpoint')
  @RateLimitIP(20, 60000) // 20 requests per minute per IP
  getPublicData() {
    return { data: 'public data' };
  }

  // Route-based rate limiting
  @Get('shared-resource')
  @RateLimitRoute(50, 60000) // 50 requests per minute for entire route
  getSharedResource() {
    return { data: 'shared resource' };
  }
}
```

### 3. Advanced Configuration

```typescript
import { RateLimit } from '../common/rate-limit.decorator';
import { RateLimitStrategy } from '../common/rate-limit.decorator';

@Controller('api')
export class AdvancedController {
  @Get('custom')
  @RateLimit({
    limit: 5,
    windowMs: 300000, // 5 minutes
    strategy: RateLimitStrategy.USER,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  })
  @UseGuards(JwtAuthGuard)
  getCustomLimited() {
    return { data: 'custom rate limited' };
  }
}
```

## Rate Limiting Strategies

### User-Based (`RateLimitStrategy.USER`)

- Limits requests per authenticated user
- Requires JWT authentication
- Key format: `user:{userId}:route:{method}:{path}`

### IP-Based (`RateLimitStrategy.IP`)

- Limits requests per IP address
- Works for unauthenticated endpoints
- Key format: `ip:{ipAddress}:route:{method}:{path}`

### Route-Based (`RateLimitStrategy.ROUTE`)

- Limits requests for entire route across all users/IPs
- Global rate limiting per endpoint
- Key format: `route:{method}:{path}`

## Response Headers

When rate limiting is applied, the following headers are set:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Reset time (ISO string)
- `Retry-After`: Seconds to wait when limit exceeded

## Error Handling

When rate limit is exceeded, a `429 Too Many Requests` response is returned:

```json
{
  "message": "Too Many Requests",
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

## Redis Implementation

The rate limiting uses Redis sorted sets with the following approach:

1. **Key Structure**: `{prefix}:{identifier}:route:{method}:{path}`
2. **Score**: Timestamp of request
3. **Member**: `{timestamp}-{random}` for uniqueness
4. **Cleanup**: Old entries are removed using `ZREMRANGEBYSCORE`
5. **Counting**: Current count using `ZCARD`
6. **Expiration**: Automatic cleanup with `EXPIRE`

## Testing

Run the tests to verify the implementation:

```bash
yarn test rate-limit.service.spec.ts
yarn test rate-limit.guard.spec.ts
```

## Example Implementation

See `rate-limit.example.controller.ts` for a complete example of how to use the rate limiting system.
