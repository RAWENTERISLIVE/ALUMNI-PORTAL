import requests

BASE_URL = "http://localhost:5000"
AUTH_USERNAME = "mpsajmer123@gmail.com"
AUTH_PASSWORD = "bajmav-1qojmu-qoKkod"
TIMEOUT = 30

def test_verify_admin_can_get_all_users():
    login_url = f"{BASE_URL}/api/auth/login"
    try:
        login_response = requests.post(
            login_url,
            json={"email": AUTH_USERNAME, "password": AUTH_PASSWORD},
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    assert login_response.status_code == 200, f"Login failed, expected status 200, got {login_response.status_code}"

    try:
        login_data = login_response.json()
    except ValueError:
        assert False, "Login response is not valid JSON"

    token = login_data.get("token") or login_data.get("accessToken")
    assert token, "No token found in login response"

    url = f"{BASE_URL}/api/users"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Assert status code is 200 OK for admin user
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Assert response is a list or has a 'users' key with a list
    assert isinstance(data, list) or (isinstance(data, dict) and "users" in data), "Response JSON does not contain user list"

    # Further check can be performed on user objects if present
    users_list = data if isinstance(data, list) else data.get("users", [])
    assert isinstance(users_list, list), "Users data is not a list"

    # Optionally verify each user dict has expected keys (e.g. id, email)
    if users_list:
        sample_user = users_list[0]
        assert isinstance(sample_user, dict), "User item is not a dict"
        assert "id" in sample_user or "_id" in sample_user or "email" in sample_user, "User item lacks expected fields"


test_verify_admin_can_get_all_users()