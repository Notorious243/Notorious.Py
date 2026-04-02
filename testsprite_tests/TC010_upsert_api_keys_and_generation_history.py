import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
AUTH_PATH = "/auth/v1/token"
USER_SETTINGS_PATH = "/rest/v1/user_settings"
TIMEOUT = 30

USERNAME = "michel.maleka1@gmail.com"
PASSWORD = "12345678"


def test_upsert_api_keys_and_generation_history():
    # Step 1: Authenticate to get JWT token
    auth_url = BASE_URL + AUTH_PATH
    auth_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        auth_response = requests.post(auth_url, json=auth_payload, timeout=TIMEOUT)
        assert auth_response.status_code == 200, f"Auth failed with status {auth_response.status_code}"
        auth_data = auth_response.json()
        token = auth_data.get("access_token")
        assert token, "No access_token in auth response"
    except requests.RequestException as e:
        assert False, f"Authentication request failed: {str(e)}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    # Step 2: Prepare user_settings upsert payload
    # Using example valid data for API keys and generation history
    user_settings_payload = {
        "user_id": "user-123",  # Assuming some known user_id or can fetch from token if possible
        "provider_keys": {
            "openai": {
                "api_key": "sk-abcdef1234567890",
                "provider": "openai",
                "updated_at": "2026-03-29T12:00:00Z"
            },
            "cohere": {
                "api_key": "cohere-abcdef1234567890",
                "provider": "cohere",
                "updated_at": "2026-03-29T11:45:00Z"
            }
        },
        "generation_history": [
            {
                "id": "gen-1",
                "provider": "openai",
                "model": "gpt-4",
                "prompt": "Generate UI code",
                "response": "some generated UI code",
                "created_at": "2026-03-28T10:00:00Z"
            },
            {
                "id": "gen-2",
                "provider": "cohere",
                "model": "command-xlarge",
                "prompt": "Modify UI code",
                "response": "some modified UI code",
                "created_at": "2026-03-28T11:00:00Z"
            }
        ]
    }

    # Step 3: Send POST request to upsert user settings
    url = BASE_URL + USER_SETTINGS_PATH
    try:
        response = requests.post(url, json=user_settings_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Unexpected status {response.status_code} in user_settings upsert"
    except requests.RequestException as e:
        assert False, f"user_settings upsert request failed: {str(e)}"


test_upsert_api_keys_and_generation_history()
