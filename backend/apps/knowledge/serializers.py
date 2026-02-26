from rest_framework import serializers
from .models import KnowledgeBaseArticle

class KnowledgeBaseArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBaseArticle
        fields = '__all__'