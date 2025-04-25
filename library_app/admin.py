from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Member, Librarian, Book, BookCopy, 
    Loan, Reservation, Event, Author, Category, 
    Fine, BookAuthor, BookCategory
)

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_superuser']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'member', 'librarian')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'member', 'librarian')}),
    )

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['memberID', 'name', 'email_address', 'phone_number', 'start_date']
    search_fields = ['name', 'email_address']

@admin.register(Librarian)
class LibrarianAdmin(admin.ModelAdmin):
    list_display = ['librarianID', 'name', 'email_address', 'phone_number']
    search_fields = ['name', 'email_address']

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['bookID', 'title', 'edition', 'total_copies', 'available_copies']
    search_fields = ['title']

@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = ['copyID', 'book', 'status']
    list_filter = ['status']

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['loanID', 'copy', 'member', 'issue_date', 'due_date', 'loan_status']
    list_filter = ['loan_status']
    search_fields = ['member__name', 'copy__book__title']

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['reservationID', 'book', 'member', 'reservation_date', 'status']
    list_filter = ['status']

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['eventID', 'name', 'start_date', 'event_time']
    search_fields = ['name']

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ['authorID', 'name']
    search_fields = ['name']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['categoryID', 'name']
    search_fields = ['name']

@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display = ['fineID', 'loan', 'amount', 'payment_status']
    list_filter = ['payment_status']

# Register the User model with custom admin
admin.site.register(User, CustomUserAdmin)

# Register the many-to-many relationship models
admin.site.register(BookAuthor)
admin.site.register(BookCategory)