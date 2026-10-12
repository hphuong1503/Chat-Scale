"""Isolated tests; never uses the development database volume."""
import os

from .settings import *  # noqa: F403

SECRET_KEY = "test-only-key-not-for-deployment-000000000000000000"
DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost"]
SIMPLE_JWT = {**SIMPLE_JWT, "SIGNING_KEY": SECRET_KEY}  # noqa: F405

if os.environ.get("CHATAPP_TEST_POSTGRES") == "1":
    DATABASES = {"default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "chatapp_ci",
        "USER": os.environ.get("CHATAPP_TEST_DB_USER", "postgres"),
        "PASSWORD": os.environ.get("CHATAPP_TEST_DB_PASSWORD", "postgres"),
        "HOST": os.environ.get("CHATAPP_TEST_DB_HOST", "127.0.0.1"),
        "PORT": os.environ.get("CHATAPP_TEST_DB_PORT", "5432"),
        "TEST": {"NAME": "test_chatapp_ci"},
    }}
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}

CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
