import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

# Credentials from instructions for basic token auth (although not used in login body)
AUTH_USERNAME = "mpsajmer123@gmail.com"
AUTH_PASSWORD = "bajmav-1qojmu-qoKkod"


def test_verify_user_login_with_correct_and_incorrect_credentials():
    headers = {
        "Content-Type": "application/json"
    }

    # Correct credentials payload
    correct_payload = {
        "email": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }

    # Incorrect credentials payload
    incorrect_payload = {
        "email": AUTH_USERNAME,
        "password": "wrongpassword123"
    }

    # Test login with correct credentials
    try:
        response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=correct_payload,
            headers=headers,
            auth=HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD),
            timeout=TIMEOUT,
        )
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Login with correct credentials failed: {e}"

    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    json_resp = response.json()
    assert "accessToken" in json_resp or "token" in json_resp or "jwt" in json_resp, "JWT token not found in response"
    assert isinstance(json_resp.get("accessToken") or json_resp.get("token") or json_resp.get("jwt"), str), "JWT token is not string"

    # Test login with incorrect credentials
    try:
        bad_response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=incorrect_payload,
            headers=headers,
            auth=HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD),
            timeout=TIMEOUT,
        )
    except requests.RequestException as e:
        # It's acceptable for server error, but we expect 401 or 400 generally
        assert False, f"Request error on login with incorrect credentials: {e}"

    # Assert that login fails (status 401 or 400 or similar)
    assert bad_response.status_code in [400, 401, 403], f"Expected failure status (400,401,403) for bad login but got {bad_response.status_code}"
    # Optionally check error message presence
    bad_json = {}
    try:
        bad_json = bad_response.json()
    except Exception:
        pass
    assert (
        "error" in bad_json or "message" in bad_json or bad_response.status_code in [400,401,403]
    ), "No error message found on failed login"


test_verify_user_login_with_correct_and_incorrect_credentials()