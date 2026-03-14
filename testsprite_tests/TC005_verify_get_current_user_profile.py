import requests

BASE_URL = "http://localhost:5000"
USERNAME = "mpsajmer123@gmail.com"
PASSWORD = "bajmav-1qojmu-qoKkod"
TIMEOUT = 30


def verify_get_current_user_profile():
    login_url = f"{BASE_URL}/api/auth/login"
    try:
        login_response = requests.post(login_url, json={"email": USERNAME, "password": PASSWORD}, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    assert login_response.status_code == 200, f"Login failed, expected status code 200, got {login_response.status_code}"

    try:
        login_data = login_response.json()
    except ValueError:
        assert False, "Login response is not valid JSON"

    assert "token" in login_data, "Login response missing 'token'"
    token = login_data["token"]

    url = f"{BASE_URL}/api/auth/me"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to /api/auth/me failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "email" in data, "Response JSON missing 'email' field"
    assert data["email"].lower() == USERNAME.lower(), "Email in response does not match authenticated user"
    assert any(key in data for key in ("id", "name", "email")), "Response missing expected profile fields"


verify_get_current_user_profile()