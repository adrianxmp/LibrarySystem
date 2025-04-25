from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import datetime, timedelta

issue_date = models.DateField(default=timezone.now)  # This will automatically use the date part

class User(AbstractUser):
    ROLE_CHOICES = (
        ('librarian', 'Librarian'),
        ('member', 'Member'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='member')
    member = models.OneToOneField('Member', on_delete=models.CASCADE, null=True, blank=True)
    librarian = models.OneToOneField('Librarian', on_delete=models.CASCADE, null=True, blank=True)

class Member(models.Model):
    memberID = models.IntegerField(primary_key=True)
    address = models.CharField(max_length=50)
    name = models.CharField(max_length=50)
    email_address = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15)
    start_date = models.DateField()

    def save(self, *args, **kwargs):
        # If memberID is not set, generate it
        if not self.memberID:
            max_id = Member.objects.aggregate(max_id=models.Max('memberID'))['max_id']
            self.memberID = (max_id or 100) + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
    
class Librarian(models.Model):
    librarianID = models.IntegerField(primary_key=True)
    email_address = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15)
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Book(models.Model):
    bookID = models.IntegerField(primary_key=True)
    title = models.CharField(max_length=100)
    edition = models.CharField(max_length=50)
    total_copies = models.IntegerField()
    available_copies = models.IntegerField()

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # If bookID is not set, generate it
        if not self.bookID:
            max_id = Book.objects.aggregate(max_id=models.Max('bookID'))['max_id']
            self.bookID = (max_id or 0) + 1
        super().save(*args, **kwargs)

class BookCopy(models.Model):
    STATUS_CHOICES = (
        ('Available', 'Available'),
        ('Borrowed', 'Borrowed'),
        ('Lost', 'Lost'),
        ('Damaged', 'Damaged'),
    )
    copyID = models.AutoField(primary_key=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')

    def __str__(self):
        return f"{self.book.title} - Copy {self.copyID}"

class Loan(models.Model):
    STATUS_CHOICES = (
        ('Borrowed', 'Borrowed'),
        ('Returned', 'Returned'),
        ('Overdue', 'Overdue'),
    )
    loanID = models.AutoField(primary_key=True)
    copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE)
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    loan_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Borrowed')
    librarian = models.ForeignKey(Librarian, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        if not self.due_date:
            # Set due date to 14 days from issue date if not provided
            issue_date = self.issue_date
            if isinstance(issue_date, datetime.datetime):
                issue_date = issue_date.date()
            self.due_date = issue_date + timedelta(days=14)
        super().save(*args, **kwargs)

class Reservation(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Fulfilled', 'Fulfilled'),
        ('Cancelled', 'Cancelled'),
    )
    reservationID = models.AutoField(primary_key=True)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    reservation_date = models.DateField(default=timezone.now)
    exp_return_date = models.DateField()

class Event(models.Model):
    eventID = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    event_time = models.TimeField()
    member = models.ForeignKey(Member, on_delete=models.CASCADE, null=True, blank=True)
    librarian = models.ForeignKey(Librarian, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Author(models.Model):
    authorID = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    books = models.ManyToManyField(Book, through='BookAuthor')

    def __str__(self):
        return self.name

class Category(models.Model):
    categoryID = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    books = models.ManyToManyField(Book, through='BookCategory')

    def __str__(self):
        return self.name

class Fine(models.Model):
    STATUS_CHOICES = (
        ('Unpaid', 'Unpaid'),
        ('Paid', 'Paid'),
    )
    fineID = models.AutoField(primary_key=True)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Unpaid')
    payment_date = models.DateField(null=True, blank=True)

class BookAuthor(models.Model):
    author = models.ForeignKey(Author, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('author', 'book')

class BookCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('category', 'book')