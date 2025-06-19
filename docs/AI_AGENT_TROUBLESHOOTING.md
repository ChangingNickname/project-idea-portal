# AI Agent Token Troubleshooting Guide

## Overview

The AI Agent system now handles token-related issues completely transparently. Users will never see technical error messages related to tokens - all recovery happens automatically in the background.

## Automatic Token Recovery

### How It Works

1. **Transparent Recovery**: When a token error occurs, the system automatically:
   - Detects the token issue
   - Generates a new token OR recreates the session
   - Retries the request
   - Continues the conversation seamlessly

2. **Session Recreation**: If a valid token exists but the session is lost from memory:
   - System automatically recreates the session
   - Maintains conversation continuity
   - No user intervention required

3. **User Experience**: Users see only friendly messages like:
   - "I'm having trouble processing your message right now. Please try again in a moment."
   - No technical details about tokens, sessions, or server errors

4. **Retry Logic**: The system will attempt up to 3 retries with automatic token regeneration and session recreation

### Error Handling Flow

```
User sends message
    ↓
Check token validity
    ↓
If token error detected
    ↓
Automatically generate new token
    ↓
Retry request (up to 3 times)
    ↓
If successful: Continue conversation
    ↓
If failed: Show friendly error message

OR

User sends message
    ↓
Token valid but session not found
    ↓
Automatically recreate session
    ↓
Continue conversation seamlessly
```

## Common Token Issues (Now Handled Automatically)

### 1. Session Token Errors

**Previously**: Users saw "Invalid session token" errors
**Now**: Completely transparent - system auto-recovers

**Causes** (handled automatically):
- Token expiration (default: 2 hours)
- Network changes causing IP mismatch
- Browser/user agent changes
- Server restart clearing in-memory sessions

### 2. Session Not Found Errors

**Previously**: Users saw "Session not found" errors
**Now**: Completely transparent - system auto-recreates sessions

**Causes** (handled automatically):
- Server restart clearing session memory
- Memory cleanup removing active sessions
- Session corruption or loss

### 3. Configuration Errors

**Previously**: Users saw "JWT secret is not configured" errors
**Now**: Friendly message asking to try again

**Causes**:
- Missing or invalid JWT secret in environment variables
- Incorrect server configuration

### 4. Network-Related Issues

**Previously**: Users saw "IP mismatch" or "Device mismatch" errors
**Now**: System adapts automatically to network changes

**Causes** (handled automatically):
- User switching networks (WiFi to mobile, VPN changes)
- Browser updates changing user agent
- Proxy or load balancer changes

## Technical Implementation

### Frontend Store (`aiagent.ts`)

```typescript
// Automatic recovery function
const sendRequestWithAutoRecovery = async (retryCount = 0) => {
  try {
    // Send request
    return await $fetch('/api/aiagent', { ... })
  } catch (error) {
    // Check if it's a token error
    if (isTokenError && retryCount < 3) {
      // Automatically regenerate token
      await this.generateToken()
      // Retry with new token
      return await sendRequestWithAutoRecovery(retryCount + 1)
    }
    
    // Return friendly message if max retries reached
    return {
      answer: "I'm having trouble processing your message right now. Please try again in a moment."
    }
  }
}
```

### Backend Token Validation (`token.ts`)

```typescript
// Automatic session recreation
if (!sessionData) {
  console.log('[Token] Session not found in active sessions, recreating session')
  
  // If token is valid but session not found, create new session
  const currentIP = getRequestIP(event) || 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') || 'unknown'
  
  sessionData = {
    deviceId: payload.deviceId,
    ip: currentIP,
    userAgent: userAgent,
    lastActivity: Date.now()
  }
  
  // Save new session
  activeSessions.set(token, sessionData)
}
```

### Backend API

All API endpoints now return user-friendly messages instead of technical errors:

```typescript
// Instead of technical error
return {
  answer: "A session error occurred. Please reset the chat..."
}

// Now returns friendly message
return {
  answer: "I'm having trouble processing your message right now. Please try again in a moment."
}
```

## Improved Token Handling

### Recent Improvements

1. **Complete Transparency**: Users never see token-related errors
2. **Automatic Recovery**: Up to 3 retry attempts with token regeneration
3. **Session Recreation**: Automatic recreation of lost sessions
4. **Friendly Messages**: All errors show user-friendly messages
5. **Flexible Validation**: IP and User-Agent changes handled gracefully
6. **Extended Token Lifetime**: Tokens last 2 hours instead of 1 hour
7. **Session Cleanup**: Automatic cleanup of expired sessions every 30 minutes

### Token Sources

The system checks for tokens in multiple locations:
1. Authorization header (`Bearer <token>`)
2. Request body (`sessionToken` field)
3. Query parameters (`?sessionToken=<token>`)

## Debugging (For Developers)

### Server Logs

Check server logs for detailed information:
- `[Token]` prefixed messages
- `[AiAgent]` prefixed messages
- `[API]` prefixed messages
- `[CreateValidatedChat]` prefixed messages

### Common Log Messages

```
[Token] Generated new token: { deviceId, ip, userAgent }
[Token] Session not found in active sessions, recreating session
[Token] Recreated session for valid token: { deviceId, ip }
[Token] IP mismatch detected: { expected, current }
[Token] Updated session with new IP
[AiAgent] Token error detected, automatically regenerating token and retrying...
[API] Session error detected, attempting to recreate and retry
[CreateValidatedChat] Successfully recreated chat session
```

### Manual Testing

```typescript
// Force token refresh (for testing)
await aiAgentStore.refreshToken()

// Clear session completely
aiAgentStore.clearSession()

// Check current token
console.log(aiAgentStore.sessionToken)
```

## API Endpoints

- `POST /api/aiagent/token.generate` - Generate new token
- `POST /api/aiagent/cleanup` - Manually trigger session cleanup
- `GET /api/aiagent` - Get current session status
- `POST /api/aiagent` - Send message to AI agent

## Best Practices

1. **Trust the System**: The automatic recovery handles most issues
2. **Monitor Logs**: Check server logs for debugging, not user-facing errors
3. **User Experience**: Focus on providing smooth, uninterrupted conversations
4. **Error Prevention**: Use stable network connections when possible
5. **Regular Maintenance**: Ensure cleanup middleware is running

## Monitoring

Monitor these metrics:
- Token generation frequency
- Session recreation frequency
- Session cleanup frequency
- Retry attempt rates
- Average session duration
- User-facing error rates (should be very low)

## Support

If issues persist:
1. Check server logs for detailed error information
2. Verify environment configuration
3. Test with a fresh browser session
4. Contact system administrator if problems continue

## User Experience

Users should now experience:
- ✅ No technical error messages
- ✅ Seamless conversation flow
- ✅ Automatic recovery from network issues
- ✅ Automatic session recreation
- ✅ Friendly error messages when needed
- ✅ No need to manually reset chat sessions 