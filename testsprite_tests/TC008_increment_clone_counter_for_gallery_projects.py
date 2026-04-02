import requests
import json

BASE_URL = "http://localhost:5173"
AUTH_USERNAME = "michel.maleka1@gmail.com"
AUTH_PASSWORD = "12345678"
TIMEOUT = 30

def get_jwt_token(email: str, password: str) -> str:
    payload = {
        "email": email,
        "password": password
    }
    r = requests.post(f"{BASE_URL}/auth/v1/token", data=json.dumps(payload), headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
    assert r.status_code == 200, f"Failed to get JWT token: {r.text}"
    resp = r.json()
    token = resp.get("access_token")
    assert token is not None, "JWT token not found in auth response"
    return token

def test_increment_clone_counter_for_gallery_projects():
    jwt_token = get_jwt_token(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }

    gallery_id = None
    project_id = None
    version_id = None

    try:
        # Step 1: Create a new project to associate with gallery
        project_payload = {
            "name": "Test Project for Clone Count Increment",
            "canvas": {},
            "created_by": AUTH_USERNAME
        }
        r = requests.post(
            f"{BASE_URL}/rest/v1/projects",
            headers=headers,
            data=json.dumps(project_payload),
            timeout=TIMEOUT
        )
        assert r.status_code == 201, f"Failed to create project: {r.text}"
        project_resp = r.json()
        project_id = project_resp.get("projectId") or project_resp.get("id")
        assert project_id is not None, "Project ID not returned in create response"

        # Step 2: Save a version snapshot for the project
        version_payload = {
            "project_id": project_id,
            "snapshot": {},
            "metadata": {}
        }
        r = requests.post(
            f"{BASE_URL}/rest/v1/project_versions",
            headers=headers,
            data=json.dumps(version_payload),
            timeout=TIMEOUT
        )
        assert r.status_code == 201, f"Failed to create project version: {r.text}"
        version_resp = r.json()
        version_id = version_resp.get("versionId") or version_resp.get("id")
        assert version_id is not None, "Version ID not returned in create response"

        # Step 3: Publish project in gallery (upsert)
        gallery_payload = {
            "project_id": project_id,
            "title": "Gallery Project for Clone Counter Test",
            "description": "Testing increment clone count"
        }
        r = requests.post(
            f"{BASE_URL}/rest/v1/gallery_projects",
            headers=headers,
            data=json.dumps(gallery_payload),
            timeout=TIMEOUT
        )
        assert r.status_code == 200, f"Failed to upsert gallery project: {r.text}"
        gallery_resp = r.json()
        if isinstance(gallery_resp, list) and len(gallery_resp) > 0:
            gallery_entry = gallery_resp[0]
        elif isinstance(gallery_resp, dict):
            gallery_entry = gallery_resp
        else:
            assert False, "Unexpected gallery project response format"
        gallery_id = gallery_entry.get("galleryId") or gallery_entry.get("id")
        assert gallery_id is not None, "Gallery ID not returned in gallery upsert response"

        # Step 4: Get the current clone_count for comparison
        current_clone_count = gallery_entry.get("clone_count", 0)
        assert isinstance(current_clone_count, int), "clone_count should be integer"

        # Step 5: Increment clone counter via RPC
        increment_payload = {
            "gallery_id": gallery_id
        }
        r = requests.post(
            f"{BASE_URL}/rest/v1/rpc/increment_clones_count",
            headers=headers,
            data=json.dumps(increment_payload),
            timeout=TIMEOUT
        )
        assert r.status_code == 200, f"Failed to increment clone count: {r.text}"
        increment_resp = r.json()
        updated_clone_count = increment_resp.get("clone_count")
        assert updated_clone_count is not None, "Updated clone_count not returned"
        assert isinstance(updated_clone_count, int), "Updated clone_count not integer"
        assert updated_clone_count == current_clone_count + 1, (
            f"clone_count not incremented as expected: before={current_clone_count}, after={updated_clone_count}"
        )

    finally:
        # Cleanup gallery project
        if gallery_id is not None:
            try:
                requests.delete(
                    f"{BASE_URL}/rest/v1/gallery_projects?id=eq.{gallery_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

        # Cleanup project versions
        if version_id is not None:
            try:
                requests.delete(
                    f"{BASE_URL}/rest/v1/project_versions?id=eq.{version_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

        # Cleanup project
        if project_id is not None:
            try:
                requests.delete(
                    f"{BASE_URL}/rest/v1/projects?id=eq.{project_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_increment_clone_counter_for_gallery_projects()