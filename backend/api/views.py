"""
Trip calculation API endpoint.
Wires together route_service, hos_engine, and log_generator.
"""
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TripInputSerializer
from .route_service import geocode, get_route, reverse_geocode, interpolate_point
from .hos_engine import plan_trip_schedule, TripSegment
from .log_generator import generate_daily_logs


def _estimate_miles_at_time(events, time_iso):
    """Estimate cumulative miles driven at a given time."""
    from datetime import datetime as dt
    target = dt.fromisoformat(time_iso) if isinstance(time_iso, str) else time_iso
    total = 0
    for e in events:
        start = dt.fromisoformat(e['start_time']) if isinstance(e['start_time'], str) else e['start_time']
        end = dt.fromisoformat(e['end_time']) if isinstance(e['end_time'], str) else e['end_time']
        if start >= target:
            break
        if e.get('miles', 0) > 0:
            if end <= target:
                total += e['miles']
            else:
                fraction = (target - start).total_seconds() / max((end - start).total_seconds(), 1)
                total += e['miles'] * fraction
    return total


class TripCalculateView(APIView):
    def post(self, request):
        serializer = TripInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        # 1. Geocode all 3 locations
        try:
            current_geo = geocode(data['current_location'])
            pickup_geo = geocode(data['pickup_location'])
            dropoff_geo = geocode(data['dropoff_location'])
        except Exception as e:
            return Response(
                {'error': f'Geocoding failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Get routes
        try:
            route1 = get_route(current_geo, pickup_geo)
            route2 = get_route(pickup_geo, dropoff_geo)
        except Exception as e:
            return Response(
                {'error': f'Routing failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Build trip segments
        segments = []

        # Drive: current -> pickup (skip if same location)
        if route1['distance_miles'] > 0.5:
            segments.append(TripSegment(
                distance_miles=route1['distance_miles'],
                duration_hours=route1['duration_hours'],
                label=f"{data['current_location']} to {data['pickup_location']}",
                coords=current_geo,
                geometry=route1['geometry'],
            ))

        # Pickup stop (1 hour loading)
        segments.append(TripSegment(
            distance_miles=0,
            duration_hours=1.0,
            label=data['pickup_location'],
            is_stop=True,
            stop_type='pickup',
            coords=pickup_geo,
        ))

        # Drive: pickup -> dropoff
        segments.append(TripSegment(
            distance_miles=route2['distance_miles'],
            duration_hours=route2['duration_hours'],
            label=f"{data['pickup_location']} to {data['dropoff_location']}",
            coords=pickup_geo,
            geometry=route2['geometry'],
        ))

        # Dropoff stop (1 hour unloading)
        segments.append(TripSegment(
            distance_miles=0,
            duration_hours=1.0,
            label=data['dropoff_location'],
            is_stop=True,
            stop_type='dropoff',
            coords=dropoff_geo,
        ))

        # 4. Build location resolver with caching
        all_geometry = route1['geometry'] + route2['geometry']
        total_route_miles = (
            route1['distance_miles'] + route2['distance_miles']
        )

        _location_cache = {}

        def location_resolver(miles_traveled):
            # Round to nearest 5 miles for cache efficiency
            cache_key = round(miles_traveled / 5) * 5
            if cache_key in _location_cache:
                return _location_cache[cache_key]

            if total_route_miles <= 0:
                return ''
            fraction = min(miles_traveled / total_route_miles, 1.0)
            point = interpolate_point(all_geometry, fraction)
            try:
                label = reverse_geocode(point['lat'], point['lng'])
            except Exception:
                label = f"{point['lat']:.2f}, {point['lng']:.2f}"

            _location_cache[cache_key] = label
            return label

        # 5. Calculate start time (next morning at 6:00 AM)
        now = datetime.now()
        start_time = now.replace(
            hour=6, minute=0, second=0, microsecond=0
        )
        if now.hour >= 6:
            start_time += timedelta(days=1)

        # 6. Run HOS scheduling
        trip_result = plan_trip_schedule(
            segments=segments,
            cycle_used=data['cycle_used'],
            start_time=start_time,
            location_resolver=location_resolver,
        )

        # 7. Post-process: add coords to stops missing them
        for stop in trip_result['stops']:
            if not stop.get('coords') and total_route_miles > 0:
                miles_at_stop = _estimate_miles_at_time(
                    trip_result['events'], stop['time']
                )
                fraction = min(miles_at_stop / total_route_miles, 1.0)
                point = interpolate_point(all_geometry, fraction)
                stop['coords'] = point

        # 8. Generate daily logs
        daily_logs = generate_daily_logs(trip_result['events'])

        # 9. Build route coordinates as [lat, lng] for Leaflet
        route_coords = [
            [coord[1], coord[0]] for coord in all_geometry
        ]

        # 9. Assemble response
        response_data = {
            'route': {
                'total_distance_miles': round(total_route_miles, 1),
                'total_drive_time_hours': round(
                    route1['duration_hours'] + route2['duration_hours'], 2
                ),
                'segments': [
                    {
                        'from': data['current_location'],
                        'to': data['pickup_location'],
                        'distance_miles': round(
                            route1['distance_miles'], 1
                        ),
                        'duration_hours': round(
                            route1['duration_hours'], 2
                        ),
                    },
                    {
                        'from': data['pickup_location'],
                        'to': data['dropoff_location'],
                        'distance_miles': round(
                            route2['distance_miles'], 1
                        ),
                        'duration_hours': round(
                            route2['duration_hours'], 2
                        ),
                    },
                ],
                'coordinates': route_coords,
            },
            'stops': trip_result['stops'],
            'daily_logs': daily_logs,
            'summary': {
                'total_miles': trip_result['total_miles'],
                'total_duration_hours': trip_result['total_duration_hours'],
                'num_days': len(daily_logs),
                'start_time': start_time.isoformat(),
                'end_time': trip_result['end_time'],
            },
            'locations': {
                'current': current_geo,
                'pickup': pickup_geo,
                'dropoff': dropoff_geo,
            },
        }

        return Response(response_data)
