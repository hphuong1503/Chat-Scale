import logging
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JwtAuthMiddleware:
    """
    Custom Middleware for Channels to authenticate via JWT in query string.
    Usage: ws://domain/ws/chat/1/?token=<jwt_token>
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")

        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token.get("user_id")
                scope["user"] = await get_user(user_id)
            except (InvalidToken, Exception) as e:
                logger.warning(f"WebSocket JWT Auth Failed: {e}")
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)

logger = logging.getLogger(__name__)


class JWTUserIDMiddleware(MiddlewareMixin):
    """
    Middleware to extract user_id from JWT token without DB query.
    Adds 'jwt_user_id' to request object for POST requests.
    """

    def process_request(self, request):
        """Extract user_id from Authorization header."""
        if request.method == 'POST' and request.path.startswith('/messages/'):
            user_id = self._extract_user_id_from_token(request)
            request.jwt_user_id = user_id
            logger.debug(f"JWT user_id extracted: {user_id}")
        return None

    @staticmethod
    def _extract_user_id_from_token(request):
        """
        Extract user_id from JWT token without DB query.
        JWT tokens contain encoded user_id that can be decoded directly.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]
        try:
            decoded_token = AccessToken(token)
            return decoded_token.get('user_id')
        except Exception as e:
            logger.warning(f"Invalid or Expired JWT token provided: {e}")
            return None
