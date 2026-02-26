from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import KnowledgeBaseArticleViewSet

router = DefaultRouter()
# Будет доступно по /api/knowledge/
router.register(r'knowledge', KnowledgeBaseArticleViewSet, basename='knowledge')

urlpatterns = [
    path('', include(router.urls)),
]