from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView,
    BookViewSet,
    BookCopyViewSet,
    DebugTokenView,
    MemberLoansView,
    MemberViewSet,
    LoanViewSet,
    EventViewSet,
    ReservationViewSet,
    FineViewSet,
    AuthorViewSet,
    CategoryViewSet,
)

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'book-copies', BookCopyViewSet)
router.register(r'members', MemberViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'events', EventViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'fines', FineViewSet)
router.register(r'authors', AuthorViewSet)
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('debug-token/', DebugTokenView.as_view(), name='debug-token'),
    path('my-loans/', LoanViewSet.as_view({'get': 'my_loans'}), name='my-loans'),
    path('member-loans/', MemberLoansView.as_view(), name='member-loans'),
    
]