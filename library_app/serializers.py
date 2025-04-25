from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import *

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['memberID', 'name', 'email_address', 'phone_number', 'address', 'start_date']
        extra_kwargs = {
            'memberID': {'required': False},
            'start_date': {'required': False},
        }

class LibrarianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Librarian
        fields = '__all__'

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['bookID', 'title', 'edition', 'total_copies', 'available_copies']
        extra_kwargs = {
            'bookID': {'required': False}
        }
class BookCopySerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    
    class Meta:
        model = BookCopy
        fields = '__all__'

class LoanSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.name', read_only=True)
    book_title = serializers.CharField(source='copy.book.title', read_only=True)
    
    class Meta:
        model = Loan
        fields = '__all__'
        extra_kwargs = {
            'issue_date': {'required': False},
            'return_date': {'required': False},
        }

def create(self, validated_data):
    # Convert datetime to date if necessary
    if 'issue_date' in validated_data and isinstance(validated_data['issue_date'], datetime.datetime):
        validated_data['issue_date'] = validated_data['issue_date'].date()
    if 'due_date' in validated_data and isinstance(validated_data['due_date'], datetime.datetime):
        validated_data['due_date'] = validated_data['due_date'].date()
    return super().create(validated_data)

class EventSerializer(serializers.ModelSerializer):
    librarian_name = serializers.CharField(source='librarian.name', read_only=True)
    
    class Meta:
        model = Event
        fields = ['eventID', 'name', 'start_date', 'end_date', 'event_time', 'librarian', 'librarian_name']
        read_only_fields = ['eventID', 'librarian']

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class FineSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='loan.member.name', read_only=True)
    book_title = serializers.CharField(source='loan.copy.book.title', read_only=True)
    days_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Fine
        fields = '__all__'
    
    def get_days_overdue(self, obj):
        if obj.loan.return_date and obj.loan.due_date:
            return (obj.loan.return_date - obj.loan.due_date).days
        return 0

class ReservationSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.name', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    
    class Meta:
        model = Reservation
        fields = '__all__'