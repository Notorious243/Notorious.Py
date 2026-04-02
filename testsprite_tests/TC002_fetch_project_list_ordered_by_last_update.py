import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
AUTH_URL = f"{BASE_URL}/auth/v1/token"
PROJECTS_URL = f"{BASE_URL}/rest/v1/projects"

USERNAME = "michel.maleka1@gmail.com"
PASSWORD = "12345678"

def test_fetch_project_list_ordered_by_last_update():
    try:
        # Authenticate to get JWT token
        auth_resp = requests.post(
            AUTH_URL,
            json={"email": USERNAME, "password": PASSWORD},
            timeout=30
        )
        assert auth_resp.status_code == 200, f"Auth failed with status {auth_resp.status_code}"
        auth_data = auth_resp.json()
        jwt_token = auth_data.get("access_token")
        assert jwt_token, "No JWT token received from auth endpoint"

        headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Accept": "application/json"
        }

        # Make GET request to fetch projects ordered by last update
        # According to the PRD, GET /rest/v1/projects returns projects,
        # we add an order query param on last update, assuming the column is updated_at or similar.
        # Since schema not fully specified, test just fetches projects and validates order by last update

        params = {
            "order": "updated_at.desc"
        }

        get_resp = requests.get(
            PROJECTS_URL,
            headers=headers,
            params=params,
            timeout=30
        )
        assert get_resp.status_code == 200, f"Unexpected status code {get_resp.status_code} from project list"

        projects = get_resp.json()
        assert isinstance(projects, list), "Response is not a list"

        # Validate projects are ordered by last update (descending)
        updated_at_list = []
        for p in projects:
            # Validate necessary fields exist
            assert "updated_at" in p or "last_update" in p or "updated_at" in p, "Project record missing updated_at or last_update"
            # Pick updated_at or last_update field if found
            if "updated_at" in p:
                updated_at_list.append(p["updated_at"])
            elif "last_update" in p:
                updated_at_list.append(p["last_update"])
            else:
                # Since no timestamp field found, skip ordering validation
                updated_at_list = []
                break

        if updated_at_list:
            # Check descending order
            sorted_list = sorted(updated_at_list, reverse=True)
            assert updated_at_list == sorted_list, "Projects are not ordered descending by last update timestamp"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_fetch_project_list_ordered_by_last_update()