import os
import sys
import tempfile
import pytest
from unittest.mock import MagicMock, patch

# Mock heavy modules before importing main
class MockTensor:
    pass

class MockTorch(MagicMock):
    Tensor = MockTensor

sys.modules["torch"] = MockTorch()
for mod in ["modal", "transformers", "google", "google.genai", "google.genai.types"]:
    if mod not in sys.modules:
        try:
            __import__(mod)
        except ImportError:
            sys.modules[mod] = MagicMock()

sys.path.insert(0, os.path.dirname(__file__))
from main import app, UPLOADS, UPLOADS_LOCK, JOBS, JOBS_LOCK
from fastapi.testclient import TestClient

client = TestClient(app)

def test_chunked_upload_flow_and_disk_streaming():
    """
    Validates:
    1. /analyze/upload/init creates a temporary file on disk and returns upload_id.
    2. /analyze/upload/chunk/{upload_id} accepts sequential binary chunks and streams directly to disk.
    3. The file on disk exactly matches the concatenated chunks without RAM exhaustion.
    4. /analyze/upload/complete/{upload_id} enqueues background processing and returns 202 { job_id }.
    """
    # 1. Init
    init_res = client.post("/analyze/upload/init")
    assert init_res.status_code == 200, f"Init failed: {init_res.text}"
    init_data = init_res.json()
    assert "upload_id" in init_data
    upload_id = init_data["upload_id"]
    
    with UPLOADS_LOCK:
        assert upload_id in UPLOADS
        temp_file_path = UPLOADS[upload_id]["file_path"]
        assert os.path.exists(temp_file_path)

    try:
        # 2. Upload chunks (3 sequential chunks of arbitrary binary data)
        chunk1 = b"CHUNK1_HEADER_METADATA_" + b"A" * 1024
        chunk2 = b"CHUNK2_BODY_KINEMATICS_" + b"B" * 2048
        chunk3 = b"CHUNK3_FOOTER_CHECKSUM_" + b"C" * 512
        expected_content = chunk1 + chunk2 + chunk3
        
        # Send raw stream chunks
        res1 = client.post(
            f"/analyze/upload/chunk/{upload_id}",
            content=chunk1,
            headers={"Content-Type": "application/octet-stream"}
        )
        assert res1.status_code == 200
        assert res1.json()["bytes_received"] == len(chunk1)
        
        res2 = client.post(
            f"/analyze/upload/chunk/{upload_id}",
            content=chunk2,
            headers={"Content-Type": "application/octet-stream"}
        )
        assert res2.status_code == 200
        assert res2.json()["bytes_received"] == len(chunk2)

        res3 = client.post(
            f"/analyze/upload/chunk/{upload_id}",
            content=chunk3,
            headers={"Content-Type": "application/octet-stream"}
        )
        assert res3.status_code == 200
        assert res3.json()["total_bytes"] == len(expected_content)

        # 3. Verify on disk
        assert os.path.getsize(temp_file_path) == len(expected_content)
        with open(temp_file_path, "rb") as f:
            disk_content = f.read()
        assert disk_content == expected_content

        # 4. Complete upload
        payload = {
            "exercise_type": "incline_press",
            "exercise_name": "Technogym Pure Strength Incline Press",
            "target_muscle": "chest",
            "load_type": "machine",
            "weight_kg": 50.0,
            "target_reps": 4
        }
        
        with patch("main.worker_process_analysis") as mock_worker:
            comp_res = client.post(f"/analyze/upload/complete/{upload_id}", json=payload)
            assert comp_res.status_code == 202
            comp_data = comp_res.json()
            assert "job_id" in comp_data
            job_id = comp_data["job_id"]
            assert comp_data["status"] == "queued"
            
            with JOBS_LOCK:
                assert job_id in JOBS
                assert JOBS[job_id]["status"] == "queued"
                
            # Verify upload_id was popped from active uploads
            with UPLOADS_LOCK:
                assert upload_id not in UPLOADS
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass

def test_chunked_upload_invalid_session_returns_404():
    res = client.post("/analyze/upload/chunk/non-existent-id", content=b"123")
    assert res.status_code == 404
    
    comp_res = client.post("/analyze/upload/complete/non-existent-id", json={})
    assert comp_res.status_code == 404
