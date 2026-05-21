"""Pet Friend backend API tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://language-learner-pal.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Root
def test_root(api):
    r = api.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert "message" in r.json()


# Lessons
def test_lessons_age_7(api):
    r = api.get(f"{BASE_URL}/api/lessons", params={"age": 7})
    assert r.status_code == 200
    ids = {l["id"] for l in r.json()}
    # age 7 should include these
    assert {"colors", "animals", "english_basic", "math_basic"}.issubset(ids)
    # exclude advanced
    assert "math_advanced" not in ids


def test_lessons_age_15(api):
    r = api.get(f"{BASE_URL}/api/lessons", params={"age": 15})
    assert r.status_code == 200
    ids = {l["id"] for l in r.json()}
    assert "math_advanced" in ids
    assert "english_intermediate" in ids
    # colors max_age is 12 so excluded
    assert "colors" not in ids
    assert "math_basic" not in ids


def test_get_lesson_colors(api):
    r = api.get(f"{BASE_URL}/api/lessons/colors")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "colors"
    assert data["title"] == "Colores"
    assert len(data["items"]) > 0


def test_get_lesson_404(api):
    r = api.get(f"{BASE_URL}/api/lessons/nonexistent")
    assert r.status_code == 404


# Pet
def test_pet_phrase(api):
    r = api.get(f"{BASE_URL}/api/pet/phrase")
    assert r.status_code == 200
    assert isinstance(r.json().get("text"), str)
    assert len(r.json()["text"]) > 0


def test_pet_gibberish_length_4(api):
    r = api.get(f"{BASE_URL}/api/pet/gibberish", params={"length": 4})
    assert r.status_code == 200
    tokens = r.json()["text"].split()
    assert len(tokens) == 4


# Health
def test_health(api):
    r = api.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
