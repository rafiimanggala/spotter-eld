"""
Route service using Nominatim (geocoding) and OSRM (routing).
No API key needed — both are free public services.
"""
import socket
import time

import requests
from urllib3.util.connection import allowed_gai_family

# Force IPv4 — Render free tier often fails with IPv6 ("Network is unreachable")
_original_gai_family = allowed_gai_family


def _forced_ipv4():
    return socket.AF_INET


requests.packages.urllib3.util.connection.allowed_gai_family = _forced_ipv4

NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
OSRM_SERVERS = [
    'https://router.project-osrm.org',
    'https://routing.openstreetmap.de/routed-car',
]

HEADERS = {
    'User-Agent': 'SpotterELDTripPlanner/1.0 (contact@spotter-eld.dev)',
}

MAX_RETRIES = 5

_last_nominatim_call = 0.0


def _rate_limit_nominatim():
    """Respect Nominatim's 1 req/sec rate limit."""
    global _last_nominatim_call
    elapsed = time.time() - _last_nominatim_call
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_nominatim_call = time.time()


def geocode(address):
    """Convert address string to {lat, lng, label}."""
    for attempt in range(MAX_RETRIES):
        _rate_limit_nominatim()
        resp = requests.get(
            f'{NOMINATIM_BASE}/search',
            params={
                'q': address,
                'format': 'json',
                'limit': 1,
                'countrycodes': 'us',
            },
            headers=HEADERS,
            timeout=10,
        )
        if resp.status_code == 429:
            time.sleep(2 ** attempt)
            continue
        resp.raise_for_status()
        break
    else:
        raise Exception(f'Nominatim rate limited after {MAX_RETRIES} retries')
    results = resp.json()
    if not results:
        raise ValueError(f'Could not geocode: {address}')
    hit = results[0]
    return {
        'lat': float(hit['lat']),
        'lng': float(hit['lon']),
        'label': hit.get('display_name', address),
    }


def get_route(start_coords, end_coords):
    """
    Get driving route via OSRM with retry + fallback servers.
    Returns distance_miles, duration_hours, geometry (list of [lng, lat]).
    """
    path = (
        f"/route/v1/driving/"
        f"{start_coords['lng']},{start_coords['lat']};"
        f"{end_coords['lng']},{end_coords['lat']}"
        f"?overview=full&geometries=geojson"
    )

    last_error = None
    for server in OSRM_SERVERS:
        for attempt in range(MAX_RETRIES):
            try:
                resp = requests.get(
                    f"{server}{path}",
                    headers=HEADERS,
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json()

                if data.get('code') != 'Ok' or not data.get('routes'):
                    raise ValueError(
                        f"OSRM routing failed: {data.get('code', 'unknown')}"
                    )

                route = data['routes'][0]
                return {
                    'distance_miles': route['distance'] / 1609.34,
                    'duration_hours': route['duration'] / 3600,
                    'geometry': route['geometry']['coordinates'],
                }
            except (requests.RequestException, ValueError) as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2 * (attempt + 1))

    raise ValueError(f"Routing failed after trying all servers: {last_error}")


def reverse_geocode(lat, lng):
    """Convert coordinates to nearest city, state string."""
    for attempt in range(MAX_RETRIES):
        _rate_limit_nominatim()
        resp = requests.get(
            f'{NOMINATIM_BASE}/reverse',
            params={
                'lat': lat,
                'lon': lng,
                'format': 'json',
            },
            headers=HEADERS,
            timeout=10,
        )
        if resp.status_code == 429:
            time.sleep(2 ** attempt)
            continue
        resp.raise_for_status()
        break
    else:
        return f'{lat:.2f}, {lng:.2f}'
    data = resp.json()

    if 'error' in data:
        return f'{lat:.2f}, {lng:.2f}'

    address = data.get('address', {})
    city = (
        address.get('city')
        or address.get('town')
        or address.get('village')
        or address.get('county', '')
    )
    state = address.get('state', '')

    if city and state:
        return f'{city}, {state}'
    return data.get('display_name', f'{lat:.2f}, {lng:.2f}')


def interpolate_point(geometry, fraction):
    """
    Get coordinates at a given fraction (0-1) along the route geometry.
    geometry: list of [lng, lat] pairs from OSRM.
    Returns: {lat, lng}
    """
    if not geometry:
        return {'lat': 0, 'lng': 0}
    if fraction <= 0:
        return {'lat': geometry[0][1], 'lng': geometry[0][0]}
    if fraction >= 1:
        return {'lat': geometry[-1][1], 'lng': geometry[-1][0]}

    total_dist = 0
    segments = []
    for i in range(len(geometry) - 1):
        dx = geometry[i + 1][0] - geometry[i][0]
        dy = geometry[i + 1][1] - geometry[i][1]
        d = (dx ** 2 + dy ** 2) ** 0.5
        segments.append(d)
        total_dist += d

    if total_dist == 0:
        return {'lat': geometry[0][1], 'lng': geometry[0][0]}

    target = total_dist * fraction
    accum = 0
    for i, d in enumerate(segments):
        if accum + d >= target:
            t = (target - accum) / d if d > 0 else 0
            lng = geometry[i][0] + t * (geometry[i + 1][0] - geometry[i][0])
            lat = geometry[i][1] + t * (geometry[i + 1][1] - geometry[i][1])
            return {'lat': lat, 'lng': lng}
        accum += d

    return {'lat': geometry[-1][1], 'lng': geometry[-1][0]}
