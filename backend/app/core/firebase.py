"""
core/firebase.py
----------------
Singleton helpers for Firestore + Auth
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import Dict, Any

from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth

load_dotenv()

ENV_KEY = "GOOGLE_APPLICATION_CREDENTIALS"
_COL_ROLES = "roles"
_COL_USERS = "users"

service_account = os.getenv(ENV_KEY)
if not service_account:
    raise EnvironmentError(f"Missing env var: {ENV_KEY}")

service_account_path = Path(service_account).expanduser().resolve()
if not service_account_path.is_file():
    raise FileNotFoundError(f"Service-account JSON not found: {service_account_path}")


@lru_cache(maxsize=1)
def get_app() -> firebase_admin.App:
    if not firebase_admin._apps:
        cred = credentials.Certificate(str(service_account_path))
        firebase_admin.initialize_app(cred)
    return firebase_admin.get_app()


@lru_cache(maxsize=1)
def get_db() -> firestore.Client:
    return firestore.client(app=get_app())


@lru_cache(maxsize=1)
def get_auth() -> auth:
    return auth


# ---------- convenience refs ------------------------------------------------ #
def roles_ref() -> firestore.CollectionReference:
    return get_db().collection(_COL_ROLES)


def users_ref() -> firestore.CollectionReference:
    return get_db().collection(_COL_USERS)


# ---------- ID-token verification ------------------------------------------ #
def verify_token(id_token: str, check_revoked: bool = False) -> Dict[str, Any]:
    """
    Decode & validate a Firebase ID token.

    Raises firebase_admin.AuthError for expired / invalid tokens.
    """
    get_app()
    return get_auth().verify_id_token(id_token, check_revoked=check_revoked)
