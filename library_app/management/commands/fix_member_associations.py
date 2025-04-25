from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from library_app.models import Member

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix member and user associations'

    def handle(self, *args, **options):
        # List all users and their associations
        self.stdout.write("Checking user associations...")
        
        for user in User.objects.all():
            self.stdout.write(f"\nUser: {user.username}")
            self.stdout.write(f"  Role: {user.role}")
            self.stdout.write(f"  Has member: {hasattr(user, 'member')}")
            self.stdout.write(f"  Has librarian: {hasattr(user, 'librarian')}")
            
            if user.role == 'member' and not hasattr(user, 'member'):
                # Try to find a member with the same email
                try:
                    member = Member.objects.get(email_address=user.email)
                    user.member = member
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f"  Fixed: Associated with member {member.memberID}"))
                except Member.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"  No member found with email {user.email}"))
        
        # List all members and their associations
        self.stdout.write("\nChecking member associations...")
        
        for member in Member.objects.all():
            associated_user = User.objects.filter(member=member).first()
            if associated_user:
                self.stdout.write(f"Member {member.memberID} ({member.name}) is associated with user {associated_user.username}")
            else:
                self.stdout.write(self.style.WARNING(f"Member {member.memberID} ({member.name}) has no associated user"))
                
                # Try to create a user for this member
                username = member.email_address.split('@')[0]
                if not User.objects.filter(username=username).exists():
                    user = User.objects.create_user(
                        username=username,
                        email=member.email_address,
                        password='member123',
                        role='member'
                    )
                    user.member = member
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f"Created user {username} for member {member.memberID}"))