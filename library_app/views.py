from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta, datetime
from .models import *
from .serializers import *
from .permissions import IsLibrarian, IsMember, IsLibrarianOrReadOnly
from rest_framework.views import APIView

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['email'] = self.user.email
        
        if self.user.role == 'librarian' and hasattr(self.user, 'librarian'):
            data['librarian_id'] = self.user.librarian.librarianID
        
        if self.user.role == 'member' and hasattr(self.user, 'member'):
            data['member_id'] = self.user.member.memberID
            
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsLibrarianOrReadOnly]

    @action(detail=True, methods=['get'])
    def copies(self, request, pk=None):
        """Get all copies of a specific book"""
        book = self.get_object()
        copies = BookCopy.objects.filter(book=book)
        serializer = BookCopySerializer(copies, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a book and its copies"""
        book_data = request.data.copy()
        
        # Auto-generate bookID if not provided
        if 'bookID' not in book_data or not book_data['bookID']:
            max_id = Book.objects.aggregate(max_id=models.Max('bookID'))['max_id']
            if max_id is None:
                book_data['bookID'] = 1
            else:
                book_data['bookID'] = max_id + 1
        
        total_copies = int(book_data.get('total_copies', 0))
        available_copies = int(book_data.get('available_copies', total_copies))
        
        # Restrict available_copies to total_copies
        book_data['available_copies'] = min(available_copies, total_copies)
        
        # Create the book
        serializer = self.get_serializer(data=book_data)
        serializer.is_valid(raise_exception=True)
        book = serializer.save()
        
        # Create book copies
        for _ in range(total_copies):
            BookCopy.objects.create(book=book, status='Available')
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Update a book and manage its copies"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Don't allow changing the bookID
        data = request.data.copy()
        if 'bookID' in data:
            del data['bookID']
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Check if total copies changed
        new_total = int(data.get('total_copies', instance.total_copies))
        current_total = instance.total_copies
        
        if new_total > current_total:
            # Add more copies
            for _ in range(new_total - current_total):
                BookCopy.objects.create(book=instance, status='Available')
            instance.available_copies += (new_total - current_total)
        elif new_total < current_total:
            # Remove copies (only available ones)
            copies_to_remove = current_total - new_total
            available_copies = BookCopy.objects.filter(book=instance, status='Available')[:copies_to_remove]
            if available_copies.count() < copies_to_remove:
                return Response(
                    {"error": "Cannot reduce total copies below number of borrowed copies"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            available_copies.delete()
            instance.available_copies = max(0, instance.available_copies - copies_to_remove)
        
        instance.total_copies = new_total
        instance.save()
        serializer.save()
        
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.all()
    serializer_class = BookCopySerializer
    permission_classes = [IsLibrarian]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available book copies"""
        copies = BookCopy.objects.filter(status='Available')
        serializer = self.get_serializer(copies, many=True)
        return Response(serializer.data)

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [IsLibrarian]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a member and associated user account"""
        member_data = request.data.copy()
        
        # Auto-generate memberID
        max_id = Member.objects.aggregate(max_id=models.Max('memberID'))['max_id']
        if max_id is None:
            member_data['memberID'] = 101  # Start from 101 for new members
        else:
            member_data['memberID'] = max_id + 1
        
        # Set start_date if not provided
        if 'start_date' not in member_data:
            member_data['start_date'] = timezone.now().date().isoformat()
        
        # Create member first
        serializer = self.get_serializer(data=member_data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save()
        
        # Create user account
        username = member_data.get('email_address', '').split('@')[0]
        if not username:
            username = f"member{member.memberID}"
        
        # Check if user already exists
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=member_data['email_address'],
                password='member123',  # Default password
                role='member'
            )
            user.member = member
            user.save()
        else:
            # If user exists, associate with member
            user = User.objects.get(username=username)
            user.member = member
            user.role = 'member'
            user.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update member information"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Update associated user email if it changed
        if 'email_address' in request.data:
            try:
                user = User.objects.get(member=instance)
                user.email = request.data['email_address']
                user.save()
            except User.DoesNotExist:
                pass
        
        return Response(serializer.data)


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsLibrarian]
    
    # Override action map to set different permissions for my_loans
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_loans(self, request):
        """Get all loans for the current member"""
        # Debug prints
        print(f"User: {request.user}")
        print(f"User role: {request.user.role}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Has member attribute: {hasattr(request.user, 'member')}")
        
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if request.user.role != 'member':
            return Response({"error": "Not a member"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            member = request.user.member
            print(f"Member ID: {member.memberID}")
            loans = Loan.objects.filter(member=member).order_by('-issue_date')
            print(f"Found {loans.count()} loans")
            serializer = self.get_serializer(loans, many=True)
            return Response(serializer.data)
        except AttributeError:
            return Response(
                {"error": "User is not properly associated with a member"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Error: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new loan and update book availability"""
        copy_id = request.data.get('copy')
        member_id = request.data.get('member')
        
        # Validate book copy availability
        copy = get_object_or_404(BookCopy, copyID=copy_id)
        if copy.status != 'Available':
            return Response(
                {"error": "This book copy is not available for loan."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check member loan limit
        member = get_object_or_404(Member, memberID=member_id)
        active_loans = Loan.objects.filter(member=member, loan_status='Borrowed').count()
        if active_loans >= 5:
            return Response(
                {"error": "Member has reached maximum loan limit."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set librarian
        if not hasattr(self.request.user, 'librarian'):
            return Response(
                {"error": "User is not associated with a librarian."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        librarian = self.request.user.librarian
        
        # Prepare data for serializer
        loan_data = request.data.copy()
        loan_data['librarian'] = librarian.librarianID
        
        # Ensure dates are properly formatted
        if 'issue_date' not in loan_data:
            loan_data['issue_date'] = timezone.now().date().isoformat()
        if 'due_date' in loan_data and isinstance(loan_data['due_date'], str):
            try:
                due_date = datetime.strptime(loan_data['due_date'], '%Y-%m-%d').date()
                loan_data['due_date'] = due_date.isoformat()
            except ValueError:
                pass
        
        serializer = self.get_serializer(data=loan_data)
        serializer.is_valid(raise_exception=True)
        
        loan = serializer.save()
        
        copy.status = 'Borrowed'
        copy.save()
        
        book = copy.book
        book.available_copies -= 1
        book.save()
        
        response_serializer = self.get_serializer(loan)
        headers = self.get_success_headers(response_serializer.data)
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def return_book(self, request, pk=None):
        """Process book return and calculate fines if necessary"""
        loan = self.get_object()
        
        if loan.loan_status == 'Returned':
            return Response(
                {"error": "This book has already been returned."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update loan status
        loan.loan_status = 'Returned'
        loan.return_date = timezone.now().date()
        loan.save()
        
        copy = loan.copy
        copy.status = 'Available'
        copy.save()
        
        book = copy.book
        book.available_copies += 1
        book.save()
        
        # Check for overdue and create fine if necessary (Just a note: we have not implemented this in the model)
        if loan.return_date > loan.due_date:
            days_overdue = (loan.return_date - loan.due_date).days
            fine_amount = days_overdue * 0.50  # $0.50 per day
            Fine.objects.create(loan=loan, amount=fine_amount)
        
        serializer = self.get_serializer(loan)
        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Delete a loan and update book availability if necessary"""
        instance = self.get_object()
        
        # If the loan is still active (book not returned), update the book copy status
        if instance.loan_status == 'Borrowed':
            copy = instance.copy
            book = copy.book
            
            # Update copy status back to available
            copy.status = 'Available'
            copy.save()
            
            # Update book available copies
            book.available_copies += 1
            book.save()
        
        # Delete any associated fines
        Fine.objects.filter(loan=instance).delete()
        
        # Perform the actual deletion
        self.perform_destroy(instance)
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsLibrarianOrReadOnly]

    def create(self, request, *args, **kwargs):
        """Create an event"""
        event_data = request.data.copy()
        
        # Get librarian
        if not hasattr(request.user, 'librarian'):
            return Response(
                {"error": "User is not associated with a librarian."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        librarian = request.user.librarian
        event_data['librarian'] = librarian.librarianID
        
        # Parse dates if they're strings
        if 'start_date' in event_data and isinstance(event_data['start_date'], str):
            try:
                start_date = datetime.strptime(event_data['start_date'], '%Y-%m-%d').date()
                if start_date < timezone.now().date():
                    return Response(
                        {"error": "Start date cannot be in the past."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {"error": "Invalid start date format."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if 'end_date' in event_data and isinstance(event_data['end_date'], str):
            try:
                end_date = datetime.strptime(event_data['end_date'], '%Y-%m-%d').date()
                if 'start_date' in event_data:
                    start_date = datetime.strptime(event_data['start_date'], '%Y-%m-%d').date()
                    if end_date < start_date:
                        return Response(
                            {"error": "End date cannot be before start date."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            except ValueError:
                return Response(
                    {"error": "Invalid end date format."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(data=event_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update an event"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        
        # Validate dates for updates
        if 'start_date' in data and isinstance(data['start_date'], str):
            try:
                start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
                if start_date < timezone.now().date():
                    return Response(
                        {"error": "Start date cannot be in the past."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except ValueError:
                return Response(
                    {"error": "Invalid start date format."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

    def perform_create(self, serializer):
        # Ensure librarian is set
        if 'librarian' not in serializer.validated_data:
            librarian = self.request.user.librarian
            serializer.save(librarian=librarian)
        else:
            serializer.save()

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'member':
            return Reservation.objects.filter(member=self.request.user.member)
        return Reservation.objects.all()

    def perform_create(self, serializer):
        if self.request.user.role == 'member':
            member = self.request.user.member
            serializer.save(member=member)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a reservation"""
        reservation = self.get_object()
        if reservation.status != 'Active':
            return Response(
                {"error": "Only active reservations can be cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'Cancelled'
        reservation.save()
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)

class FineViewSet(viewsets.ModelViewSet):
    queryset = Fine.objects.all()
    serializer_class = FineSerializer
    permission_classes = [IsLibrarian]

    @action(detail=True, methods=['post'])
    def pay_fine(self, request, pk=None):
        """Mark a fine as paid"""
        fine = self.get_object()
        if fine.payment_status == 'Paid':
            return Response(
                {"error": "This fine has already been paid"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        fine.payment_status = 'Paid'
        fine.payment_date = timezone.now().date()
        fine.save()
        serializer = self.get_serializer(fine)
        return Response(serializer.data)

class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    permission_classes = [IsLibrarianOrReadOnly]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsLibrarianOrReadOnly]


class DebugTokenView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Debug endpoint to check user authentication and roles"""
        return Response({
            'user': request.user.username,
            'role': request.user.role,
            'is_authenticated': request.user.is_authenticated,
            'has_member': hasattr(request.user, 'member'),
            'has_librarian': hasattr(request.user, 'librarian'),
            'member_id': request.user.member.memberID if hasattr(request.user, 'member') else None,
            'librarian_id': request.user.librarian.librarianID if hasattr(request.user, 'librarian') else None,
        })

class MemberLoansView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all loans for the current member"""
        # Debug prints for debugging purposes only
        print(f"User: {request.user}")
        print(f"User role: {request.user.role}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Has member attribute: {hasattr(request.user, 'member')}")
        
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if request.user.role != 'member':
            return Response({"error": "Not a member"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            member = request.user.member
            print(f"Member ID: {member.memberID}")
            loans = Loan.objects.filter(member=member).order_by('-issue_date')
            print(f"Found {loans.count()} loans")
            serializer = LoanSerializer(loans, many=True)
            return Response(serializer.data)
        except AttributeError:
            return Response(
                {"error": "User is not properly associated with a member"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Error: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )