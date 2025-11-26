from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from chat.models import Message
import uuid
import random

class Command(BaseCommand):
    help = 'Seeds 50k messages for a single user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to assign messages to')

    def handle(self, *args, **options):
        username = options['username']
        User = get_user_model()
        
        # Get or create the user
        try:
            user = User.objects.get(username=username)
            self.stdout.write(self.style.SUCCESS(f'Found user "{username}"'))
        except User.DoesNotExist:
            user = User.objects.create_user(username=username, password='password123')
            self.stdout.write(self.style.SUCCESS(f'Created user "{username}"'))

        messages_to_create = []
        total_messages = 50000
        batch_size = 5000

        self.stdout.write(f'Generating {total_messages} messages...')

        for i in range(total_messages):
            messages_to_create.append(
                Message(
                    sender=user,
                    room_id=random.randint(1, 10),
                    message=f'This is seeded message number {i+1} for user {username}'
                )
            )
            
            if len(messages_to_create) >= batch_size:
                Message.objects.bulk_create(messages_to_create)
                self.stdout.write(f'Created {i+1} messages...')
                messages_to_create = []

        if messages_to_create:
            Message.objects.bulk_create(messages_to_create)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {total_messages} messages for user "{username}"'))
