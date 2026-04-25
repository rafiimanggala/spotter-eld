from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'spotter-eld-api'})


urlpatterns = [
    path('', health_check),
    path('health/', health_check),
    path('api/', include('api.urls')),
]
