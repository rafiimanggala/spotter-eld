"""
Convert trip events into daily ELD log sheets.
Each sheet covers one calendar day (midnight to midnight).
All 4 status rows must sum to exactly 24.0 hours per day.
"""
from datetime import datetime, timedelta
from collections import defaultdict

STATUS_ROWS = ['off_duty', 'sleeper', 'driving', 'on_duty']


def _parse_time(t):
    """Parse ISO string or return datetime as-is."""
    if isinstance(t, str):
        return datetime.fromisoformat(t)
    return t


def _time_to_day_fraction(dt):
    """Convert datetime to hours since midnight (0.0 - 24.0)."""
    return dt.hour + dt.minute / 60 + dt.second / 3600


def _split_event_at_midnight(event):
    """Split an event that crosses midnight into per-day pieces."""
    start = _parse_time(event['start_time'])
    end = _parse_time(event['end_time'])

    if start >= end:
        return [event]

    pieces = []
    current = start

    while current.date() < end.date():
        next_midnight = datetime(
            current.year, current.month, current.day
        ) + timedelta(days=1)
        duration_hrs = (next_midnight - current).total_seconds() / 3600
        total_duration = (end - start).total_seconds() / 3600
        if total_duration > 0:
            mile_fraction = duration_hrs / total_duration
        else:
            mile_fraction = 0
        piece_miles = event.get('miles', 0) * mile_fraction

        pieces.append({
            **event,
            'start_time': current.isoformat(),
            'end_time': next_midnight.isoformat(),
            'miles': round(piece_miles, 1),
        })
        current = next_midnight

    if current < end:
        remaining_hrs = (end - current).total_seconds() / 3600
        total_duration = (end - start).total_seconds() / 3600
        if total_duration > 0:
            mile_fraction = remaining_hrs / total_duration
        else:
            mile_fraction = 0
        piece_miles = event.get('miles', 0) * mile_fraction

        pieces.append({
            **event,
            'start_time': current.isoformat(),
            'end_time': end.isoformat(),
            'miles': round(piece_miles, 1),
        })

    return pieces if pieces else [event]


def _extract_location(events, prefer_last=False):
    """Extract a location string from events with non-empty location."""
    search = reversed(events) if prefer_last else iter(events)
    for evt in search:
        loc = evt.get('location', '')
        if loc and evt.get('type') != 'off_duty':
            return loc
    return ''


def generate_daily_logs(events, cycle_used=0):
    """
    Convert trip events into daily log sheets.

    Each sheet covers one calendar day (midnight to midnight).
    Gaps between events are filled with off-duty.
    Each day's totals MUST sum to 24.0 hours per day.
    """
    if not events:
        return []

    day_events = defaultdict(list)

    for event in events:
        pieces = _split_event_at_midnight(event)
        for piece in pieces:
            start = _parse_time(piece['start_time'])
            day_key = start.date().isoformat()
            day_events[day_key].append(piece)

    if not day_events:
        return []

    all_dates = sorted(day_events.keys())
    first_date = datetime.fromisoformat(all_dates[0]).date()
    last_date = datetime.fromisoformat(all_dates[-1]).date()

    logs = []
    current_date = first_date
    cumulative_on_duty = cycle_used

    while current_date <= last_date:
        day_key = current_date.isoformat()
        day_evts = day_events.get(day_key, [])

        day_start = datetime(
            current_date.year, current_date.month, current_date.day
        )
        day_end = day_start + timedelta(days=1)

        day_evts.sort(key=lambda e: _parse_time(e['start_time']))

        filled_events = []
        last_end = day_start

        for evt in day_evts:
            evt_start = _parse_time(evt['start_time'])
            if evt_start > last_end:
                filled_events.append({
                    'start_time': last_end.isoformat(),
                    'end_time': evt_start.isoformat(),
                    'status': 'off_duty',
                    'type': 'off_duty',
                    'location': '',
                    'miles': 0,
                })
            filled_events.append(evt)
            last_end = max(last_end, _parse_time(evt['end_time']))

        if last_end < day_end:
            filled_events.append({
                'start_time': last_end.isoformat(),
                'end_time': day_end.isoformat(),
                'status': 'off_duty',
                'type': 'off_duty',
                'location': '',
                'miles': 0,
            })

        totals = {s: 0.0 for s in STATUS_ROWS}
        total_miles = 0
        remarks = []
        entries = []

        for evt in filled_events:
            start = _parse_time(evt['start_time'])
            end = _parse_time(evt['end_time'])
            hours = (end - start).total_seconds() / 3600
            status = evt['status']

            if status in totals:
                totals[status] += hours

            if evt.get('miles', 0) > 0:
                total_miles += evt['miles']

            evt_type = evt.get('type', '')
            if evt.get('location') and evt_type != 'off_duty':
                remarks.append({
                    'time': round(_time_to_day_fraction(start), 2),
                    'location': evt['location'],
                    'activity': evt_type.replace('_', ' ').title(),
                })

            start_frac = _time_to_day_fraction(start)
            end_frac = _time_to_day_fraction(end)
            if end == day_end:
                end_frac = 24.0

            entries.append({
                'start': round(start_frac, 2),
                'end': round(end_frac, 2),
                'status': status,
                'type': evt_type,
                'location': evt.get('location', ''),
            })

        totals = {k: round(v, 2) for k, v in totals.items()}

        day_on_duty = round(totals['driving'] + totals['on_duty'], 2)
        cumulative_on_duty += day_on_duty

        from_location = _extract_location(filled_events, prefer_last=False)
        to_location = _extract_location(filled_events, prefer_last=True)

        logs.append({
            'date': day_key,
            'total_miles': round(total_miles, 1),
            'entries': entries,
            'totals': totals,
            'total_on_duty': day_on_duty,
            'remarks': remarks,
            'from_location': from_location,
            'to_location': to_location,
            'recap': {
                'on_duty_today': day_on_duty,
                'cycle_used': round(cumulative_on_duty, 1),
                'cycle_remaining': round(70 - cumulative_on_duty, 1),
            },
        })

        current_date += timedelta(days=1)

    return logs
