from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet

router = DefaultRouter()
# Регистрируем tickets. Будут доступны: /tickets/, /tickets/{id}/, /tickets/{id}/messages/
router.register(r'tickets', TicketViewSet, basename='ticket')

urlpatterns = [
    path('', include(router.urls)),
]