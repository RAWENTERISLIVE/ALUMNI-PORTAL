import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
AUTH_USERNAME = "mpsajmer123@gmail.com"
AUTH_PASSWORD = "bajmav-1qojmu-qoKkod"

def test_verify_password_reset_request_and_token_generation():
    url = f"{BASE_URL}/api/auth/forgot-password"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": AUTH_USERNAME
    }
    try:
        # Make POST request using basic auth (token type is basic token, so using HTTPBasicAuth)
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            auth=HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD),
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Check for HTTP 200 or 201 as success (assuming API returns 200 OK for password reset request)
    assert response.status_code in (200, 201), f"Expected 200 or 201, got {response.status_code}, response: {response.text}"

    # Parse JSON response
    try:
        response_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Expecting a reset token in response, key might be "resetToken" or similar (guessing)
    # Validate that token exists and is a non-empty string
    token = response_json.get("resetToken") or response_json.get("token") or response_json.get("reset_token")
    assert token is not None, f"Response JSON does not contain reset token key. Response: {response_json}"
    assert isinstance(token, str) and token.strip(), "Reset token is empty or not a string"

test_verify_password_reset_request_and_token_generation()