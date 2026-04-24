"""
FMCSA Hours of Service (HOS) scheduling engine.

Implements the state machine that plans a truck trip with full HOS compliance:
- 14-hour driving window (not pauseable)
- 11-hour max driving within window
- 30-minute break after 8 cumulative hours driving
- 10-hour consecutive off-duty between shifts
- 70-hour/8-day cycle limit
- 34-hour restart to reset cycle
- Fuel every 1000 miles (30 min on-duty stop)
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, Callable

FUEL_INTERVAL_MILES = 1000
FUEL_STOP_MINUTES = 30
BREAK_MINUTES = 30
PRE_TRIP_MINUTES = 15
POST_TRIP_MINUTES = 15
PICKUP_DROPOFF_HOURS = 1.0


@dataclass
class TripSegment:
    distance_miles: float
    duration_hours: float
    label: str
    is_stop: bool = False
    stop_type: str = ''
    coords: Optional[dict] = None
    geometry: Optional[list] = None


@dataclass
class TripEvent:
    start_time: datetime
    end_time: datetime
    status: str          # 'off_duty', 'sleeper', 'driving', 'on_duty'
    event_type: str      # 'pre_trip', 'driving', 'pickup', 'dropoff', 'fuel',
                         # 'break', 'rest', 'restart', 'post_trip', 'off_duty'
    location: str = ''
    miles: float = 0
    coords: Optional[dict] = None

    @property
    def duration_hours(self):
        return (self.end_time - self.start_time).total_seconds() / 3600

    def to_dict(self):
        return {
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'status': self.status,
            'type': self.event_type,
            'location': self.location,
            'miles': round(self.miles, 1),
            'duration_hours': round(self.duration_hours, 2),
            'coords': self.coords,
        }


@dataclass
class HOSState:
    driving_today: float = 0         # max 11 hr
    window_used: float = 0           # max 14 hr
    driving_since_break: float = 0   # max 8 hr
    cycle_remaining: float = 70      # min 0
    current_time: datetime = None
    miles_since_fuel: float = 0
    total_miles: float = 0
    events: list = field(default_factory=list)
    stops: list = field(default_factory=list)

    def time_to_drive_limit(self):
        return max(0, 11 - self.driving_today)

    def time_to_window_limit(self):
        return max(0, 14 - self.window_used)

    def time_to_break(self):
        return max(0, 8 - self.driving_since_break)

    def time_to_cycle_limit(self):
        return max(0, self.cycle_remaining)

    def can_drive(self):
        return (
            self.driving_today < 11 - 0.01
            and self.window_used < 14 - 0.01
            and self.driving_since_break < 8 - 0.01
            and self.cycle_remaining > 0.01
        )

    def advance_time(self, hours):
        self.current_time += timedelta(hours=hours)

    def add_driving(self, hours, miles):
        self.driving_today += hours
        self.window_used += hours
        self.driving_since_break += hours
        self.cycle_remaining -= hours
        self.miles_since_fuel += miles
        self.total_miles += miles

    def add_on_duty(self, hours):
        self.window_used += hours
        self.cycle_remaining -= hours

    def reset_daily(self):
        """10-hour off-duty reset."""
        self.driving_today = 0
        self.window_used = 0
        self.driving_since_break = 0

    def reset_cycle(self):
        """34-hour restart."""
        self.reset_daily()
        self.cycle_remaining = 70

    def reset_break_clock(self):
        """30-min break resets 8-hour driving clock."""
        self.driving_since_break = 0


def _add_event(state, duration_hours, status, event_type,
               location='', miles=0, coords=None):
    """Add an event and advance the clock."""
    start = state.current_time
    state.advance_time(duration_hours)
    event = TripEvent(
        start_time=start,
        end_time=state.current_time,
        status=status,
        event_type=event_type,
        location=location,
        miles=miles,
        coords=coords,
    )
    state.events.append(event)
    return event


def _resolve_location(state, location_resolver):
    """Get location string for current position."""
    if location_resolver:
        try:
            return location_resolver(state.total_miles)
        except Exception:
            return ''
    return ''


def _insert_mandatory_break(state, location='', coords=None):
    """Insert 30-min off-duty break (resets 8hr driving clock)."""
    _add_event(
        state, BREAK_MINUTES / 60, 'off_duty', 'break',
        location, coords=coords,
    )
    # 14-hour window is NOT pauseable — off-duty still counts
    state.window_used += BREAK_MINUTES / 60
    state.reset_break_clock()
    state.stops.append({
        'type': 'break',
        'location': location,
        'time': state.current_time.isoformat(),
        'duration': BREAK_MINUTES,
        'coords': coords,
    })


def _insert_rest(state, location='', coords=None):
    """Insert 10-hour off-duty rest (resets daily clocks)."""
    _add_event(
        state, 10, 'sleeper', 'rest',
        location, coords=coords,
    )
    state.reset_daily()
    state.stops.append({
        'type': 'rest',
        'location': location,
        'time': state.current_time.isoformat(),
        'duration': 600,
        'coords': coords,
    })


def _insert_restart(state, location='', coords=None):
    """Insert 34-hour restart (resets everything including cycle)."""
    _add_event(
        state, 34, 'sleeper', 'restart',
        location, coords=coords,
    )
    state.reset_cycle()
    state.stops.append({
        'type': 'restart',
        'location': location,
        'time': state.current_time.isoformat(),
        'duration': 2040,
        'coords': coords,
    })


def _insert_fuel_stop(state, location='', coords=None):
    """
    Insert 30-min fuel stop.
    If within 30 min of needing a break, make it off-duty (double as break).
    """
    needs_break_soon = state.driving_since_break >= 7.5
    if needs_break_soon:
        _add_event(
            state, FUEL_STOP_MINUTES / 60, 'off_duty', 'fuel',
            location, coords=coords,
        )
        # 14-hour window is NOT pauseable
        state.window_used += FUEL_STOP_MINUTES / 60
        state.reset_break_clock()
    else:
        _add_event(
            state, FUEL_STOP_MINUTES / 60, 'on_duty', 'fuel',
            location, coords=coords,
        )
        state.add_on_duty(FUEL_STOP_MINUTES / 60)
    state.miles_since_fuel = 0
    state.stops.append({
        'type': 'fuel',
        'location': location,
        'time': state.current_time.isoformat(),
        'duration': FUEL_STOP_MINUTES,
        'coords': coords,
    })


def _drive_segment(state, segment, location_resolver=None):
    """Drive a segment, inserting breaks/rests/fuel as needed."""
    remaining_miles = segment.distance_miles
    remaining_hours = segment.duration_hours

    if remaining_hours <= 0:
        return

    speed = segment.distance_miles / segment.duration_hours

    iteration_guard = 0
    max_iterations = 200

    while remaining_hours > 0.01 and iteration_guard < max_iterations:
        iteration_guard += 1

        # Check if we need rest/restart before driving
        if not state.can_drive():
            loc = _resolve_location(state, location_resolver)
            if state.cycle_remaining <= 0.01:
                _insert_restart(state, loc)
            else:
                _insert_rest(state, loc)
            continue

        # Calculate how far we can drive before hitting a limit
        time_limits = [
            remaining_hours,
            state.time_to_drive_limit(),
            state.time_to_window_limit(),
            state.time_to_break(),
            state.time_to_cycle_limit(),
        ]

        miles_to_fuel = max(0, FUEL_INTERVAL_MILES - state.miles_since_fuel)
        hours_to_fuel = miles_to_fuel / speed if speed > 0 else float('inf')

        drive_time = min(min(time_limits), hours_to_fuel)

        if drive_time < 0.001:
            drive_time = 0.01

        drive_miles = drive_time * speed

        # Clamp to remaining
        if drive_miles > remaining_miles:
            drive_miles = remaining_miles
            drive_time = remaining_miles / speed if speed > 0 else 0

        # Add driving event with resolved location
        drive_loc = _resolve_location(state, location_resolver)
        _add_event(
            state, drive_time, 'driving', 'driving',
            location=drive_loc, miles=drive_miles,
        )
        state.add_driving(drive_time, drive_miles)

        remaining_hours -= drive_time
        remaining_miles -= drive_miles

        if remaining_hours <= 0.01:
            break

        # Determine why we stopped and insert appropriate event
        loc = _resolve_location(state, location_resolver)

        if state.miles_since_fuel >= FUEL_INTERVAL_MILES - 1:
            _insert_fuel_stop(state, loc)
        elif state.driving_since_break >= 8 - 0.01:
            _insert_mandatory_break(state, loc)
        elif state.driving_today >= 11 - 0.01 or state.window_used >= 14 - 0.01:
            _insert_rest(state, loc)
        elif state.cycle_remaining <= 0.01:
            _insert_restart(state, loc)


def plan_trip_schedule(segments, cycle_used, start_time,
                       location_resolver=None):
    """
    Plan a complete trip with HOS compliance.

    Args:
        segments: List of TripSegment objects
        cycle_used: Hours already used from 70hr/8day cycle
        start_time: datetime when trip begins
        location_resolver: Optional callable(miles) -> location string

    Returns:
        dict with 'events', 'stops', 'total_miles', 'total_duration_hours',
        'end_time'
    """
    state = HOSState(
        cycle_remaining=70 - cycle_used,
        current_time=start_time,
    )

    if not segments:
        return {
            'events': [],
            'stops': [],
            'total_miles': 0,
            'total_duration_hours': 0,
            'end_time': start_time.isoformat(),
        }

    # Determine start location from first segment
    start_location = ''
    start_coords = None
    if segments:
        first = segments[0]
        if first.label and ' to ' in first.label:
            start_location = first.label.split(' to ')[0]
        elif first.label:
            start_location = first.label
        start_coords = first.coords

    # Check if we need a restart before we can even start
    if state.cycle_remaining <= 0.01:
        _insert_restart(state, start_location, start_coords)

    # Pre-trip inspection (15 min on-duty)
    _add_event(
        state, PRE_TRIP_MINUTES / 60, 'on_duty', 'pre_trip',
        location=start_location, coords=start_coords,
    )
    state.add_on_duty(PRE_TRIP_MINUTES / 60)

    for segment in segments:
        if segment.is_stop:
            # Pickup or dropoff — 1hr on-duty not driving
            event_type = segment.stop_type
            _add_event(
                state, segment.duration_hours, 'on_duty', event_type,
                location=segment.label, coords=segment.coords,
            )
            state.add_on_duty(segment.duration_hours)
            state.stops.append({
                'type': segment.stop_type,
                'location': segment.label,
                'time': state.current_time.isoformat(),
                'duration': int(segment.duration_hours * 60),
                'coords': segment.coords,
            })
        else:
            _drive_segment(state, segment, location_resolver)

    # Determine end location from last segment
    end_location = ''
    end_coords = None
    if segments:
        last = segments[-1]
        if last.label and ' to ' in last.label:
            end_location = last.label.split(' to ')[-1]
        elif last.label:
            end_location = last.label
        end_coords = last.coords

    # Post-trip inspection (15 min on-duty)
    _add_event(
        state, POST_TRIP_MINUTES / 60, 'on_duty', 'post_trip',
        location=end_location, coords=end_coords,
    )
    state.add_on_duty(POST_TRIP_MINUTES / 60)

    return {
        'events': [e.to_dict() for e in state.events],
        'stops': state.stops,
        'total_miles': round(state.total_miles, 1),
        'total_duration_hours': round(
            (state.current_time - start_time).total_seconds() / 3600, 2
        ),
        'end_time': state.current_time.isoformat(),
    }
