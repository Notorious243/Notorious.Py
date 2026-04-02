import requests
from requests.auth import HTTPBasicAuth
import json

BASE_URL = "http://localhost:5173"
AUTH_URL = f"{BASE_URL}/auth/v1/token"
PROJECTS_URL = f"{BASE_URL}/rest/v1/projects"
PROJECT_VERSIONS_URL = f"{BASE_URL}/rest/v1/project_versions"
TIMEOUT = 30

USERNAME = "michel.maleka1@gmail.com"
PASSWORD = "12345678"

def test_save_version_snapshots_for_project():
    # Authenticate and get JWT token
    auth_resp = requests.post(
        AUTH_URL,
        data={"email": USERNAME, "password": PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=TIMEOUT,
    )
    assert auth_resp.status_code == 200, f"Auth failed: {auth_resp.text}"
    auth_data = auth_resp.json()
    assert "access_token" in auth_data, "No access_token in auth response"
    jwt_token = auth_data["access_token"]

    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    project_id = None
    version_id = None

    try:
        # Create a project to link the version snapshot
        project_payload = {
            "name": "Test Project for Version Snapshot",
            "canvas": json.dumps({"widgets": []}),
            "created_by": USERNAME,
        }
        create_proj_resp = requests.post(
            PROJECTS_URL, headers=headers, json=project_payload, timeout=TIMEOUT
        )
        assert create_proj_resp.status_code == 201, f"Create project failed: {create_proj_resp.text}"
        project_resp_data = create_proj_resp.json()
        # Supabase typically returns an array of created objects
        if isinstance(project_resp_data, list) and len(project_resp_data) > 0:
            project_id = project_resp_data[0].get("id") or project_resp_data[0].get("projectId")
        else:
            # fallback if response is dictionary
            project_id = project_resp_data.get("id") or project_resp_data.get("projectId")

        assert project_id is not None, "Project ID not received after creation"

        # Prepare a snapshot for the version (sample snapshot content)
        version_payload = {
            "project_id": project_id,
            "snapshot": json.dumps({
                "canvas": {"widgets": [{"type": "button", "text": "Click me"}]},
                "version_meta": {"description": "Initial version snapshot"}
            }),
            "metadata": json.dumps({"created_by": USERNAME, "notes": "Test version snapshot"})
        }

        save_version_resp = requests.post(
            PROJECT_VERSIONS_URL, headers=headers, json=version_payload, timeout=TIMEOUT
        )
        assert save_version_resp.status_code == 201, f"Save version snapshot failed: {save_version_resp.text}"

        version_resp_data = save_version_resp.json()
        # Supabase usually returns an array of inserted records
        if isinstance(version_resp_data, list) and len(version_resp_data) > 0:
            version_id = version_resp_data[0].get("id") or version_resp_data[0].get("versionId")
        else:
            version_id = version_resp_data.get("id") or version_resp_data.get("versionId")

        assert version_id is not None, "Version ID not received after saving snapshot"

    finally:
        # Cleanup: delete the created project (which cascades versions)
        if project_id:
            delete_resp = requests.delete(
                f"{PROJECTS_URL}?id=eq.{project_id}",
                headers=headers,
                timeout=TIMEOUT,
            )
            assert delete_resp.status_code == 204, f"Project cleanup failed: {delete_resp.text}"


test_save_version_snapshots_for_project()
