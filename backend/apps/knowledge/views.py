from rest_framework import viewsets, filters
from .models import KnowledgeBaseArticle
from .serializers import KnowledgeBaseArticleSerializer

class KnowledgeBaseArticleViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeBaseArticle.objects.all()
    serializer_class = KnowledgeBaseArticleSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'tags']