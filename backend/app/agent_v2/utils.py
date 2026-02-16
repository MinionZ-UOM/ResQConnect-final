import requests, base64

def fetch_image_as_b64(url: str) -> str:
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        return base64.b64encode(r.content).decode("utf-8")
    except Exception:
        return ""

def log(msg: str, level="INFO"):
    print(f"[{level}] {msg}")
