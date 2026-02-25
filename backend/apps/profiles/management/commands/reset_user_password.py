"""
Management command to reset password for a specific user
Run: python manage.py reset_user_password <email> <new_password>
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Reset password for a user by email'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email address')
        parser.add_argument('password', type=str, help='New password')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        
        try:
            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Password reset for {user.username} ({email})'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ No user found with email: {email}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))
