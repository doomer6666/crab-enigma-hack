from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'size' # Чтобы фронт мог менять размер через ?size=
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'items': data,
            'total': self.page.paginator.count
        })