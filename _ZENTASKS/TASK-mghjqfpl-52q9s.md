# 1. Test User Registration Backend Endpoint

## Task Information

**ID:** TASK-mghjqfpl-52q9s

**Status:** pending

**Priority:** high

**Dependencies:** None

**Created:** 08/10/2025

**Updated:** 08/10/2025

## Description

Verify that the user registration endpoint at /api/auth/register is working correctly by testing with valid and invalid data. Check if the backend server is running and properly connected to MongoDB.

## Implementation Details

- Start the backend server if not running
- Test registration with valid admission number
- Test registration with manual verification
- Test duplicate email validation
- Test invalid admission number format
- Check database connection and user creation
- Verify response status codes and error messages

## Test Strategy

Run backend server, send POST requests to /api/auth/register endpoint with various test cases, verify responses and database entries
