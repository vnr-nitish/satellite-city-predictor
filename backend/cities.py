"""
Small curated city -> (lat, lon) lookup.

v1 keeps this as a static table (no geocoding API dependency, no API key,
works offline). Extending this list is just adding a row; a future version
could swap this for a free geocoder (e.g. OpenStreetMap Nominatim) if
free-text city search becomes a requirement.
"""

CITIES = {
    # India
    "Hyderabad": (17.3850, 78.4867),
    "Visakhapatnam": (17.6868, 83.2185),
    "Bengaluru": (12.9716, 77.5946),
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.7041, 77.1025),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Pune": (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873),
    "Lucknow": (26.8467, 80.9462),
    "Kochi": (9.9312, 76.2673),
    "Bhopal": (23.2599, 77.4126),
    "Guwahati": (26.1445, 91.7362),
    # Rest of the world (spread across latitudes/hemispheres for varied orbit visibility)
    "New York": (40.7128, -74.0060),
    "London": (51.5074, -0.1278),
    "Tokyo": (35.6762, 139.6503),
    "Sydney": (-33.8688, 151.2093),
    "San Francisco": (37.7749, -122.4194),
    "Dubai": (25.2048, 55.2708),
    "Singapore": (1.3521, 103.8198),
    "Paris": (48.8566, 2.3522),
    "Berlin": (52.5200, 13.4050),
    "Moscow": (55.7558, 37.6173),
    "Beijing": (39.9042, 116.4074),
    "Cape Town": (-33.9249, 18.4241),
    "Sao Paulo": (-23.5505, -46.6333),
    "Toronto": (43.6532, -79.3832),
    "Cairo": (30.0444, 31.2357),
    "Nairobi": (-1.2921, 36.8219),
    "Auckland": (-36.8485, 174.7633),
}


def list_cities():
    return sorted(CITIES.keys())


def get_city_coords(name: str):
    return CITIES.get(name)
