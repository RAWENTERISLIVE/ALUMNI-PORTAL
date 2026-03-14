import requests

BASE_URL = "http://localhost:5000"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
ME_ENDPOINT = "/api/auth/me"
TIMEOUT = 30

USERNAME = "mpsajmer123@gmail.com"
PASSWORD = "bajmav-1qojmu-qoKkod"

def test_verify_user_logout_clears_session_and_tokens():
    # Step 1: Login to get access token
    login_payload = {"email": USERNAME, "password": PASSWORD}
    login_resp = requests.post(
        BASE_URL + LOGIN_ENDPOINT, json=login_payload, timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert "accessToken" in login_data, "Access token missing in login response"
    token = login_data["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Verify /api/auth/me returns user info (token valid)
    me_resp = requests.get(BASE_URL + ME_ENDPOINT, headers=headers, timeout=TIMEOUT)
    assert me_resp.status_code == 200, f"Authenticated user fetch failed: {me_resp.text}"
    me_data = me_resp.json()
    assert "email" in me_data and me_data["email"] == USERNAME, "Returned user email does not match"

    # Step 3: Logout user to invalidate session and tokens
    logout_resp = requests.post(BASE_URL + LOGOUT_ENDPOINT, headers=headers, timeout=TIMEOUT)
    assert logout_resp.status_code in (200, 204), f"Logout failed: {logout_resp.text}"

    # Step 4: Verify that token is invalid after logout (accessing /api/auth/me again)
    me_after_logout_resp = requests.get(BASE_URL + ME_ENDPOINT, headers=headers, timeout=TIMEOUT)
    # Expect unauthorized or forbidden error indicating token invalidation
    assert me_after_logout_resp.status_code in (401, 403), (
        "Token still valid after logout, session/token was not invalidated properly"
    )

test_verify_user_logout_clears_session_and_tokens()
