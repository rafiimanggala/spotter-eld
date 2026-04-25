"""
Route service using Nominatim (geocoding) and OSRM (routing).
No API key needed — both are free public services.
"""
import logging
import socket
import time

logger = logging.getLogger(__name__)

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

CITY_COORDS = {
    'new york': (40.7128, -74.0060), 'nyc': (40.7128, -74.0060),
    'los angeles': (34.0522, -118.2437), 'la': (34.0522, -118.2437),
    'chicago': (41.8781, -87.6298), 'houston': (29.7604, -95.3698),
    'phoenix': (33.4484, -112.0740), 'philadelphia': (39.9526, -75.1652),
    'san antonio': (29.4241, -98.4936), 'san diego': (32.7157, -117.1611),
    'dallas': (32.7767, -96.7970), 'san jose': (37.3382, -121.8863),
    'austin': (30.2672, -97.7431), 'jacksonville': (30.3322, -81.6557),
    'fort worth': (32.7555, -97.3308), 'columbus': (39.9612, -82.9988),
    'indianapolis': (39.7684, -86.1581), 'charlotte': (35.2271, -80.8431),
    'san francisco': (37.7749, -122.4194), 'seattle': (47.6062, -122.3321),
    'denver': (39.7392, -104.9903), 'nashville': (36.1627, -86.7816),
    'oklahoma city': (35.4676, -97.5164), 'el paso': (31.7619, -106.4850),
    'boston': (42.3601, -71.0589), 'portland': (45.5152, -122.6784),
    'las vegas': (36.1699, -115.1398), 'memphis': (35.1495, -90.0490),
    'louisville': (38.2527, -85.7585), 'baltimore': (39.2904, -76.6122),
    'milwaukee': (43.0389, -87.9065), 'albuquerque': (35.0844, -106.6504),
    'tucson': (32.2226, -110.9747), 'fresno': (36.7378, -119.7871),
    'sacramento': (38.5816, -121.4944), 'mesa': (33.4152, -111.8315),
    'kansas city': (39.0997, -94.5786), 'atlanta': (33.7490, -84.3880),
    'omaha': (41.2565, -95.9345), 'miami': (25.7617, -80.1918),
    'minneapolis': (44.9778, -93.2650), 'tulsa': (36.1540, -95.9928),
    'tampa': (27.9506, -82.4572), 'new orleans': (29.9511, -90.0715),
    'cleveland': (41.4993, -81.6944), 'pittsburgh': (40.4406, -79.9959),
    'st louis': (38.6270, -90.1994), 'saint louis': (38.6270, -90.1994),
    'cincinnati': (39.1031, -84.5120), 'orlando': (28.5383, -81.3792),
    'detroit': (42.3314, -83.0458), 'raleigh': (35.7796, -78.6382),
    'salt lake city': (40.7608, -111.8910), 'richmond': (37.5407, -77.4360),
    'boise': (43.6150, -116.2023), 'des moines': (41.5868, -93.6250),
}

_geocode_cache = {}


def _fuzzy_city_match(address):
    """Try to match address to known city coordinates."""
    addr_lower = address.strip().lower()
    for city, (lat, lng) in CITY_COORDS.items():
        if city in addr_lower:
            return {'lat': lat, 'lng': lng, 'label': address}
    return None


def _rate_limit_nominatim():
    """Respect Nominatim's 1 req/sec rate limit."""
    global _last_nominatim_call
    elapsed = time.time() - _last_nominatim_call
    if elapsed < 1.5:
        time.sleep(1.5 - elapsed)
    _last_nominatim_call = time.time()


def geocode(address):
    """Convert address string to {lat, lng, label} with cache + city fallback."""
    cache_key = address.strip().lower()
    if cache_key in _geocode_cache:
        logger.info('Geocode cache hit for: %s', address)
        return _geocode_cache[cache_key]

    for attempt in range(MAX_RETRIES):
        _rate_limit_nominatim()
        try:
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
        except requests.exceptions.RequestException as e:
            logger.warning('Nominatim request failed attempt %d: %s', attempt + 1, e)
            time.sleep(2 ** attempt)
            continue

        if resp.status_code == 429:
            wait_time = min(2 ** (attempt + 1), 30)
            logger.warning('Nominatim rate limited attempt %d for: %s (waiting %ds)', attempt + 1, address, wait_time)
            time.sleep(wait_time)
            continue
        resp.raise_for_status()
        results = resp.json()
        if results:
            hit = results[0]
            result = {
                'lat': float(hit['lat']),
                'lng': float(hit['lon']),
                'label': hit.get('display_name', address),
            }
            _geocode_cache[cache_key] = result
            return result
        break

    fallback = _fuzzy_city_match(address)
    if fallback:
        logger.info('Using city coordinate fallback for: %s', address)
        _geocode_cache[cache_key] = fallback
        return fallback

    raise ValueError(f'Could not geocode: {address}')


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
                result = {
                    'distance_miles': route['distance'] / 1609.34,
                    'duration_hours': route['duration'] / 3600,
                    'geometry': route['geometry']['coordinates'],
                }
                logger.info(
                    'Route calculated: %.1f miles, %.2f hours',
                    result['distance_miles'], result['duration_hours'],
                )
                return result
            except (requests.RequestException, ValueError) as e:
                last_error = e
                logger.warning('Routing attempt %d failed on %s: %s', attempt + 1, server, e)
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
