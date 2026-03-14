import requests

BASE_URL = "http://localhost:5000"
USERNAME = "mpsajmer123@gmail.com"
PASSWORD = "bajmav-1qojmu-qoKkod"
TIMEOUT = 30

def verify_access_token_refresh_functionality():
    login_url = f"{BASE_URL}/api/auth/login"
    refresh_url = f"{BASE_URL}/api/auth/refresh-token"

    # Step 1: Login to get initial access and refresh tokens
    login_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    headers = {"Content-Type": "application/json"}

    try:
        login_resp = requests.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "accessToken" in login_data or "access_token" in login_data, "Access token missing in login response"
        assert "refreshToken" in login_data or "refresh_token" in login_data, "Refresh token missing in login response"

        # Extract tokens, handle possible keys
        refresh_token = login_data.get("refreshToken") or login_data.get("refresh_token")
        assert isinstance(refresh_token, str) and refresh_token, "Invalid refresh token received"

        # Step 2: Refresh access token using valid refresh token
        refresh_payload = {"refreshToken": refresh_token}
        refresh_resp = requests.post(refresh_url, json=refresh_payload, headers=headers, timeout=TIMEOUT)
        assert refresh_resp.status_code == 200, f"Refresh token failed with status {refresh_resp.status_code}"
        refresh_data = refresh_resp.json()
        assert "accessToken" in refresh_data or "access_token" in refresh_data, "Access token missing in refresh response"

        # Step 3: Try refresh with invalid refresh token
        invalid_refresh_payload = {"refreshToken": "invalid-or-expired-token"}
        invalid_resp = requests.post(refresh_url, json=invalid_refresh_payload, headers=headers, timeout=TIMEOUT)
        # Expecting failure status code, normally 401 or 400
        assert invalid_resp.status_code in (400, 401, 403), f"Invalid token refresh did not fail as expected, got {invalid_resp.status_code}"

        # Step 4: Optionally test with expired token if such token can be simulated
        # Not possible here, so skipped.

    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Test failed: {e}")

verify_access_token_refresh_functionality()