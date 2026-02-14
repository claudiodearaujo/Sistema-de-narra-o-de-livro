# Manual Testing Guide for Session Management

This document provides step-by-step instructions to manually test the session management improvements.

## Prerequisites

- Backend running on port 3000
- Frontend running on port 5173
- Clean browser session (clear localStorage/sessionStorage)

## Test 1: Session Persistence Across Browser Refresh

**Objective**: Verify that sessions are restored when returning to the browser.

### Steps:
1. Start the backend and frontend
2. Open browser and navigate to http://localhost:5173
3. Log in with valid credentials
4. Verify you're logged in (see user data)
5. **Refresh the browser (F5 or Ctrl+R)**
6. **Expected**: You should remain logged in without being redirected to SSO
7. Check browser console for message: `[AuthGuard] Session restored from storage`

### Success Criteria:
- ✅ User remains authenticated after refresh
- ✅ No redirect to SSO login
- ✅ Console shows session restoration message
- ✅ All data loads correctly

---

## Test 2: Session Expiration and Auto-Renewal

**Objective**: Verify that expired sessions are automatically renewed if refresh token is valid.

### Steps:
1. Log in to the application
2. Open browser DevTools > Application > Local Storage
3. Find `auth-storage` key
4. Modify the `sessionExpiresAt` value to a past timestamp (e.g., `Date.now() - 10000`)
5. **Refresh the browser**
6. **Expected**: Session should be automatically refreshed
7. Check console for message: `[AuthGuard] Session refreshed successfully`

### Success Criteria:
- ✅ Expired session is detected
- ✅ Token refresh is attempted
- ✅ New token is obtained
- ✅ User remains logged in
- ✅ Console shows refresh success message

---

## Test 3: No Infinite Loops on Session Expiry

**Objective**: Verify that the application doesn't create infinite request loops when session expires.

### Steps:
1. Log in to the application
2. Stop the backend server
3. Navigate around the app (try to load books, chapters, etc.)
4. **Expected**: Requests should fail gracefully
5. Check Network tab - should see max 3 retry attempts
6. Console should show: `[HTTP] Max refresh attempts reached`
7. After 3 attempts, user should be logged out
8. No continuous requests should be made

### Success Criteria:
- ✅ Maximum 3 refresh attempts
- ✅ 5-second cooldown between attempts
- ✅ All queries cancelled after max attempts
- ✅ User logged out and redirected to login
- ✅ No infinite loop of requests

---

## Test 4: Token Refresh with 401 Errors

**Objective**: Verify token refresh works when access token expires during normal use.

### Setup:
In backend `.env`, set short expiration for testing:
```
JWT_EXPIRES_IN=10s
JWT_REFRESH_EXPIRES_IN=5m
```

### Steps:
1. Log in to the application
2. Wait for 15 seconds (token expires)
3. Perform an action that requires API call (e.g., load books)
4. **Expected**: Request should fail with 401, then auto-refresh and retry
5. Check console for refresh activity
6. The action should succeed after refresh

### Success Criteria:
- ✅ Initial request fails with 401
- ✅ Token refresh is triggered automatically
- ✅ New token is obtained
- ✅ Original request is retried and succeeds
- ✅ User doesn't notice the refresh

---

## Test 5: Session Duration Configuration

**Objective**: Verify that environment variables control session duration.

### Test 5a: With Environment Variables

1. Set in backend `.env`:
   ```
   JWT_EXPIRES_IN=2d
   JWT_REFRESH_EXPIRES_IN=30d
   ```
2. Restart backend
3. Log in
4. Check the auth response: `expiresIn` should be `172800` (2 days in seconds)

### Test 5b: Without Environment Variables

1. Remove/comment out `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` from `.env`
2. Restart backend
3. Log in
4. Check the auth response: `expiresIn` should still be `172800` (default 2 days)

### Success Criteria:
- ✅ Environment variables are used when set
- ✅ Default values (2 days) are used when not set
- ✅ Expiration time is correctly calculated
- ✅ Session expires at the correct time

---

## Test 6: Query Cancellation on Auth Error

**Objective**: Verify that all React Query queries are cancelled on authentication error.

### Steps:
1. Log in to the application
2. Navigate to a page with multiple data loads (e.g., studio page)
3. Open Network tab in DevTools
4. Delete the refresh token cookie or invalidate it in backend database
5. Trigger a data refresh (e.g., reload books)
6. **Expected**: 401 error should trigger query cancellation
7. Check console for: `[QueryClient] Auth error detected, clearing all queries`

### Success Criteria:
- ✅ All ongoing queries are cancelled
- ✅ No new queries are started after 401
- ✅ Query cache is cleared
- ✅ User is logged out

---

## Test 7: Session Validity Check

**Objective**: Verify the session validity checking functions work correctly.

### Steps:
1. Log in to the application
2. Open browser console
3. Run: `localStorage.getItem('auth-storage')`
4. Parse the JSON and check `sessionExpiresAt`
5. Compare with current time: `Date.now()`
6. Session should be valid if `sessionExpiresAt > Date.now()`

### Success Criteria:
- ✅ `sessionExpiresAt` is set correctly
- ✅ It's approximately 2 days in the future (default)
- ✅ Session validity can be checked

---

## Test 8: Multiple Tab Synchronization

**Objective**: Verify that session state is synchronized across browser tabs.

### Steps:
1. Log in in Tab 1
2. Open Tab 2 to the same app
3. Tab 2 should automatically be logged in (session restored)
4. Log out in Tab 1
5. **Expected**: Tab 2 should also log out (via localStorage sync)
6. Both tabs should redirect to login

### Success Criteria:
- ✅ Session is shared across tabs
- ✅ Logout in one tab affects all tabs
- ✅ Login in one tab affects all tabs

---

## Troubleshooting

### Issue: Session not persisting
- Check browser localStorage for `auth-storage` key
- Verify `sessionExpiresAt` is set and in the future
- Check console for errors

### Issue: Infinite loops
- Clear browser cache and localStorage
- Check Network tab for continuous requests
- Verify cooldown and max attempts are working
- Look for console messages about refresh attempts

### Issue: Session expires too quickly
- Check `.env` configuration
- Verify `JWT_EXPIRES_IN` is set correctly
- Check backend logs for token generation

### Issue: Can't log in
- Check backend is running
- Verify database is accessible
- Check backend logs for errors
- Clear browser cache and try again

---

## Expected Console Messages

When everything is working correctly, you should see:

**On successful session restoration:**
```
[AuthGuard] Session restored from storage
```

**On session refresh:**
```
[AuthGuard] Session expired, attempting refresh
[AuthGuard] Session refreshed successfully
```

**On token refresh:**
```
[HTTP] Token refresh successful
```

**On session expiry:**
```
[HTTP] Token refresh failed
[HTTP] Max refresh attempts reached, session expired
[HTTP] Session expired, clearing auth and redirecting
```

**On query cancellation:**
```
[QueryClient] Auth error detected, clearing all queries
```

---

## Performance Expectations

- Initial login: < 500ms
- Session restoration: < 100ms (from localStorage)
- Token refresh: < 500ms
- Session expiry detection: Immediate
- Query cancellation: < 100ms

All timings assume local development environment.
