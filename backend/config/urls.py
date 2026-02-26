from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Наши API
    path('api/', include('apps.tickets.urls')),
    path('api/', include('apps.knowledge.urls')),

    # Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema.json', SpectacularAPIView.as_view(), name='schema'),
    # Интерфейс Swagger (самый популярный)
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Интерфейс Redoc (альтернативный, красивый)
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]