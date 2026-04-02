import requests

BASE_URL = "http://localhost:5173"
USERNAME = "michel.maleka1@gmail.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_list_and_fetch_version_records_by_project():
    # Authenticate and get JWT token
    auth_url = f"{BASE_URL}/auth/v1/token"
    auth_payload = {"email": USERNAME, "password": PASSWORD}
    auth_response = requests.post(auth_url, json=auth_payload, timeout=TIMEOUT)
    assert auth_response.status_code == 200, f"Authentication failed: {auth_response.text}"
    jwt_token = auth_response.json().get("access_token")
    assert jwt_token, "JWT token not found in auth response"

    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Prefer": "return=representation"
    }

    project_id = None
    version_id = None

    try:
        # Step 1: Create a project to retrieve versions for
        create_project_url = f"{BASE_URL}/rest/v1/projects"
        project_payload = {
            "name": "Test Project for Version Records",
            "canvas": {},  # assuming empty dict is acceptable for initial canvas
            "created_by": USERNAME
        }
        create_project_resp = requests.post(create_project_url, json=project_payload, headers=headers, timeout=TIMEOUT)
        assert create_project_resp.status_code == 201, f"Failed to create project: {create_project_resp.text}"
        created_projects = create_project_resp.json()
        assert isinstance(created_projects, list) and len(created_projects) > 0, "Create project response format invalid"
        project_id = created_projects[0].get("id") or created_projects[0].get("projectId") or created_projects[0].get("id")
        assert project_id, "Project ID not returned after creation"

        # Step 2: Create a version snapshot for the project
        create_version_url = f"{BASE_URL}/rest/v1/project_versions"
        version_payload = {
            "project_id": project_id,
            "snapshot": {"dummy": "snapshot data"},
            "metadata": {"version_note": "Initial version snapshot"}
        }
        create_version_resp = requests.post(create_version_url, json=version_payload, headers=headers, timeout=TIMEOUT)
        assert create_version_resp.status_code == 201, f"Failed to create project version: {create_version_resp.text}"
        version_resp_json = create_version_resp.json()
        assert isinstance(version_resp_json, list) and len(version_resp_json) > 0, "Create version response format invalid"
        version_id = version_resp_json[0].get("id") or version_resp_json[0].get("versionId")
        assert version_id, "Version ID not returned after creation"

        # Step 3: List versions filtered by project_id
        list_versions_url = f"{BASE_URL}/rest/v1/project_versions"
        params = {"project_id": f"eq.{project_id}"}
        list_versions_resp = requests.get(list_versions_url, headers=headers, params=params, timeout=TIMEOUT)
        assert list_versions_resp.status_code == 200, f"Failed to list project versions: {list_versions_resp.text}"
        versions_list = list_versions_resp.json()
        assert isinstance(versions_list, list), "Versions list is not a list"
        assert any(v.get("id") == version_id for v in versions_list), "Created version not found in versions list"

    finally:
        # Cleanup version record if created
        if version_id is not None:
            try:
                delete_version_url = f"{BASE_URL}/rest/v1/project_versions?id=eq.{version_id}"
                del_version_resp = requests.delete(delete_version_url, headers=headers, timeout=TIMEOUT)
                assert del_version_resp.status_code in (204, 200), f"Failed to delete project version {version_id}: {del_version_resp.text}"
            except Exception:
                pass
        # Cleanup project record if created
        if project_id is not None:
            try:
                delete_project_url = f"{BASE_URL}/rest/v1/projects?id=eq.{project_id}"
                del_project_resp = requests.delete(delete_project_url, headers=headers, timeout=TIMEOUT)
                assert del_project_resp.status_code in (204, 200), f"Failed to delete project {project_id}: {del_project_resp.text}"
            except Exception:
                pass

test_list_and_fetch_version_records_by_project()
