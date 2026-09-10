"""
Small curated city -> (lat, lon) lookup.

v1 keeps this as a static table (no geocoding API dependency, no API key,
works offline). Extending this list is just adding a row; a future version
could swap this for a free geocoder (e.g. OpenStreetMap Nominatim) if
free-text city search becomes a requirement.
"""

CITIES = {
    "Hyderabad": (17.3850, 78.4867),
    "Visakhapatnam": (17.6868, 83.2185),
    "Bengaluru": (12.9716, 77.5946),
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.7041, 77.1025),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Pune": (18.5204, 73.8567),
    "New York": (40.7128, -74.0060),
    "London": (51.5074, -0.1278),
    "Tokyo": (35.6762, 139.6503),
    "Sydney": (-33.8688, 151.2093),
    "San Francisco": (37.7749, -122.4194),
    "Dubai": (25.2048, 55.2708),
    "Singapore": (1.3521, 103.8198),
}


def list_cities():
    return sorted(CITIES.keys())


def get_city_coords(name: str):
    return CITIES.get(name)
