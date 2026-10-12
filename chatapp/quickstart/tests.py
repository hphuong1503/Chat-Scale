from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class AuthViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.username = "testuser"
        self.password = "Secr3tPass!"
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email="testuser@example.com",
        )

    def test_login_success(self):
        response = self.client.post(
            "/auth/login/",
            {"username": self.username, "password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["id"], self.user.id)
        self.assertEqual(response.data["user"]["username"], self.username)
        self.assertEqual(response.data["user"]["email"], "testuser@example.com")

    def test_login_invalid_credentials(self):
        response = self.client.post(
            "/auth/login/",
            {"username": self.username, "password": "WrongPassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn("access", response.data)

    def test_refresh_token_success(self):
        login_res = self.client.post(
            "/auth/login/",
            {"username": self.username, "password": self.password},
            format="json",
        )
        refresh_token = login_res.data["refresh"]

        refresh_res = self.client.post(
            "/auth/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)
        self.assertTrue(len(refresh_res.data["access"]) > 0)

    def test_refresh_token_invalid(self):
        response = self.client.post(
            "/auth/refresh/",
            {"refresh": "invalid-token-string"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get("code"), "token_not_valid")

    def test_refresh_token_missing_payload(self):
        response = self.client.post(
            "/auth/refresh/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("refresh", response.data)
