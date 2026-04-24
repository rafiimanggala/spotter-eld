# Spotter ELD Trip Planner

FMCSA Hours of Service compliant trip planner with route mapping and ELD daily log sheet generation.

## Live Demo

- **Frontend**: https://frontend-lac-alpha-42.vercel.app
- **Backend API**: https://spotter-eld-api.onrender.com

## Features

- **Route Planning**: Enter current location, pickup, and dropoff to generate an optimized truck route
- **HOS Compliance**: Full FMCSA Hours of Service scheduling engine
  - 14-hour driving window
  - 11-hour driving limit
  - 30-minute break after 8 hours driving
  - 10-hour mandatory rest between shifts
  - 70-hour/8-day cycle tracking with 34-hour restart
  - Fuel stops every 1,000 miles
- **Route Map**: Interactive Leaflet map with route polyline and stop markers
- **ELD Daily Log Sheets**: Canvas-drawn FMCSA-compliant daily logs with:
  - 4-row status grid (Off Duty, Sleeper Berth, Driving, On Duty)
  - 24-hour timeline with 15-minute granularity
  - Continuous status lines with dots and vertical transitions
  - 45-degree diagonal remarks
  - Circled on-duty totals
  - Each day sums to exactly 24 hours

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 5 + Django REST Framework |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Map | Leaflet + react-leaflet |
| Log Drawing | HTML5 Canvas |
| Routing | OSRM (Open Source Routing Machine) |
| Geocoding | Nominatim (OpenStreetMap) |
| Hosting | Vercel (frontend) + Render (backend) |

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `localhost:8001`.

## API

### `POST /api/trip/calculate`

**Request:**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Indianapolis, IN",
  "dropoff_location": "Nashville, TN",
  "cycle_used": 20
}
```

**Response:** Route coordinates, stops (pickup/dropoff/fuel/break/rest), daily log sheets with entries and totals.

## Tests

```bash
cd backend
source venv/bin/activate
python manage.py test api.tests -v 2
```

15 tests covering HOS engine rules and log generator correctness.

## Architecture

```
backend/
  api/
    hos_engine.py      # FMCSA HOS state machine
    route_service.py   # Nominatim geocoding + OSRM routing
    log_generator.py   # Event → daily log sheet conversion
    views.py           # REST API endpoint
    serializers.py     # Input validation

frontend/
  src/
    components/
      TripForm.jsx     # Input form
      RouteMap.jsx     # Leaflet map
      LogSheet.jsx     # Canvas log sheet wrapper
      StopsList.jsx    # Trip stops table
    utils/
      logDrawer.js     # FMCSA log sheet Canvas renderer
    hooks/
      useTripCalculation.js
```
