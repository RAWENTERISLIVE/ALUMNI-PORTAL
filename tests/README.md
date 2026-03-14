# Tests Structure

Organized testing structure for unit, integration, and E2E tests.

## Unit Tests
Tests for individual functions, components, and utilities.

Location: `tests/unit/`

Examples:
- `auth.test.ts` - Test auth functions (login, register, etc.)
- `apiService.test.ts` - Test API calls
- `utils.test.ts` - Test utility functions

## Integration Tests
Tests that verify different parts work together.

Location: `tests/integration/`

Examples:
- `auth-flow.test.ts` - Test complete auth flow
- `post-creation.test.ts` - Test post creation with comments
- `mentorship-request.test.ts` - Test mentorship flow

## E2E Tests
Full user journey tests using Playwright or Cypress.

Location: `tests/e2e/`

Examples:
- `auth.e2e.ts` - User registration and login flow
- `post-interaction.e2e.ts` - Post creation and interaction
- `profile-setup.e2e.ts` - Setting up user profile

## Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- auth.test.ts

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run integration tests
npm run test:integration
```

## Test File Naming Convention

- Unit tests: `[feature].test.ts`
- Integration tests: `[feature]-flow.test.ts`
- E2E tests: `[feature].e2e.ts`

## Test Structure Example

```typescript
describe('Auth Feature', () => {
  describe('Login', () => {
    it('should login user with valid credentials', () => {
      // test code
    });

    it('should reject login with invalid credentials', () => {
      // test code
    });
  });

  describe('Register', () => {
    it('should register new user', () => {
      // test code
    });
  });
});
```
