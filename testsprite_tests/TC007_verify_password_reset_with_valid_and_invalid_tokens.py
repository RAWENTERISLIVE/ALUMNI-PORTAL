import requests
import time

BASE_URL = "http://localhost:5000"
AUTH_USERNAME = "mpsajmer123@gmail.com"
AUTH_PASSWORD = "bajmav-1qojmu-qoKkod"
TIMEOUT = 30

def test_verify_password_reset_with_valid_and_invalid_tokens():
    session = requests.Session()
    
    headers_json = {
        "Content-Type": "application/json"
    }
    
    # Step 2: Request password reset token via forgot-password endpoint
    forgot_password_payload = { "email": AUTH_USERNAME }
    try:
        resp = session.post(f"{BASE_URL}/api/auth/forgot-password", json=forgot_password_payload, headers=headers_json, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Forgot password request failed: {resp.text}"
        response_json = resp.json()
        # Try 'resetToken' or 'token'
        reset_token = response_json.get("resetToken") or response_json.get("token")
        assert reset_token and isinstance(reset_token, str), "Reset token not found in forgot-password response"
    except Exception as e:
        raise AssertionError(f"Failed to request password reset token: {e}")

    # Step 3: Use valid token to reset password
    new_password_valid = "NewPassw0rd!2025"
    reset_password_payload_valid = {
        "token": reset_token,
        "password": new_password_valid
    }
    try:
        resp = session.post(f"{BASE_URL}/api/auth/reset-password", json=reset_password_payload_valid, headers=headers_json, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Password reset with valid token failed: {resp.text}"
        resp_json = resp.json()
        assert ("message" in resp_json and isinstance(resp_json.get("message"), str)) or resp_json.get("success") is True
    except Exception as e:
        raise AssertionError(f"Password reset with valid token request failed: {e}")

    # Step 4: Verify that the password was actually reset by logging in with the new password
    login_payload_new_password = {
        "email": AUTH_USERNAME,
        "password": new_password_valid
    }
    try:
        resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload_new_password, headers=headers_json, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Login with new password failed: {resp.text}"
        login_json = resp.json()
        assert "accessToken" in login_json or "token" in login_json, "Login response missing access token"
    except Exception as e:
        raise AssertionError(f"Login with new password failed: {e}")

    # Step 5: Try to reset password with an invalid token
    reset_password_payload_invalid = {
        "token": "invalid_or_expired_token_example",
        "password": "AnotherPass123!"
    }
    try:
        resp = session.post(f"{BASE_URL}/api/auth/reset-password", json=reset_password_payload_invalid, headers=headers_json, timeout=TIMEOUT)
        # Expect failure - usually 400 or 401 or 403
        assert resp.status_code in (400, 401, 403), f"Invalid token reset password did not fail as expected, status: {resp.status_code}"
        resp_json = resp.json()
        assert "error" in resp_json or "message" in resp_json, "Expected error message in invalid token response"
    except Exception as e:
        raise AssertionError(f"Password reset request with invalid token failed unexpectedly: {e}")

    # Step 6: Try to reset password with expired token simulation (reuse token)
    try:
        resp = session.post(f"{BASE_URL}/api/auth/reset-password", json=reset_password_payload_valid, headers=headers_json, timeout=TIMEOUT)
        # Should fail because token was already used
        assert resp.status_code in (400, 401, 403), f"Reusing reset token did not fail as expected, status: {resp.status_code}"
        resp_json = resp.json()
        assert "error" in resp_json or "message" in resp_json, "Expected error message on reused token"
    except Exception as e:
        raise AssertionError(f"Password reset request reusing token failed unexpectedly: {e}")

    # Step 7: Restore original password to leave test environment same as before
    restore_password_payload = {
        "token": reset_token,
        "password": AUTH_PASSWORD
    }
    # Getting new reset token
    try:
        resp = session.post(f"{BASE_URL}/api/auth/forgot-password", json=forgot_password_payload, headers=headers_json, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Forgot password request for restore failed: {resp.text}"
        reset_token_restore = resp.json().get("resetToken") or resp.json().get("token")
        assert reset_token_restore, "Reset token for restore not obtained"
    except Exception as e:
        raise AssertionError(f"Failed to request reset token for restoring original password: {e}")

    restore_password_payload["token"] = reset_token_restore
    try:
        resp = session.post(f"{BASE_URL}/api/auth/reset-password", json=restore_password_payload, headers=headers_json, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Restoring original password failed: {resp.text}"
    except Exception as e:
        raise AssertionError(f"Request to restore original password failed: {e}")

    # Verify login with original password again
    login_payload_original_password = {
        "email": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }
    try:
        resp = session.post(f"{BASE_URL}/api/auth/login", json=login_payload_original_password, headers=headers_json, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Login with original password after restore failed: {resp.text}"
        login_json = resp.json()
        assert "accessToken" in login_json or "token" in login_json, "Login response missing access token after restore"
    except Exception as e:
        raise AssertionError(f"Login with original password after restore failed: {e}")


test_verify_password_reset_with_valid_and_invalid_tokens()