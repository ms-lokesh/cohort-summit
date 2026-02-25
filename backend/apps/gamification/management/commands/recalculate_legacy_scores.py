#!/usr/bin/env python3
"""
Recalculate Legacy Scores for all students
This script recalculates legacy scores from all completed season scores
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.gamification.models import LegacyScore, SeasonScore

User = get_user_model()


class Command(BaseCommand):
    help = 'Recalculate legacy scores for all students from their season scores'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Recalculate for specific username only',
        )

    def handle(self, *args, **options):
        username = options.get('username')
        
        if username:
            # Recalculate for specific user
            try:
                user = User.objects.get(username=username)
                users = [user]
                self.stdout.write(f"Recalculating legacy score for {username}...")
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"User {username} not found"))
                return
        else:
            # Get all users who have completed season scores
            users = User.objects.filter(
                season_scores__season_completed=True
            ).distinct()
            self.stdout.write(f"Recalculating legacy scores for {users.count()} students...")
        
        updated_count = 0
        for user in users:
            # Get or create legacy score
            legacy_score, created = LegacyScore.objects.get_or_create(student=user)
            
            # Store old value
            old_total = legacy_score.total_legacy_points
            
            # Recalculate
            legacy_score.recalculate_from_season_scores()
            
            # Show changes
            if old_total != legacy_score.total_legacy_points:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ {user.username}: {old_total} → {legacy_score.total_legacy_points} "
                        f"({legacy_score.seasons_completed} seasons, "
                        f"+{legacy_score.ascension_bonus_total} ascension bonus)"
                    )
                )
                updated_count += 1
            else:
                self.stdout.write(
                    f"  {user.username}: {legacy_score.total_legacy_points} (no change)"
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Recalculation complete! Updated {updated_count} students."
            )
        )
