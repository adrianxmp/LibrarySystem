from django.core.management.base import BaseCommand
from library_app.models import Loan, Member, User

class Command(BaseCommand):
    help = 'List all loans and their associations'

    def handle(self, *args, **options):
        self.stdout.write("Listing all loans...")
        
        for loan in Loan.objects.all():
            self.stdout.write(f"\nLoan ID: {loan.loanID}")
            self.stdout.write(f"  Book: {loan.copy.book.title}")
            self.stdout.write(f"  Member ID: {loan.member.memberID}")
            self.stdout.write(f"  Member Name: {loan.member.name}")
            self.stdout.write(f"  Member Email: {loan.member.email_address}")
            self.stdout.write(f"  Status: {loan.loan_status}")
            
            # Check if member has associated user
            try:
                user = User.objects.get(member=loan.member)
                self.stdout.write(f"  Associated User: {user.username}")
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  No user associated with this member"))