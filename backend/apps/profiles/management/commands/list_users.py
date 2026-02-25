"""
Management command to list all users in the database
Run: python manage.py list_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Lists all users in the database'

    def handle(self, *args, **options):
        users = User.objects.all().order_by('id')
        
        if not users:
            self.stdout.write(self.style.WARNING('No users found in database'))
            return
        
        self.stdout.write(f'\nFound {users.count()} users:\n')
        self.stdout.write('-' * 80)
        
        for user in users:
            self.stdout.write(
                f"ID: {user.id:3d} | Username: {user.username:20s} | Email: {user.email:30s} | "
                f"Active: {user.is_active} | Staff: {user.is_staff} | Super: {user.is_superuser}"
            )
        
        self.stdout.write('-' * 80)
        self.stdout.write(f'\nTotal: {users.count()} users\n')
