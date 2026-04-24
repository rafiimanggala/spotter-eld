from datetime import datetime
from django.test import SimpleTestCase
from api.hos_engine import plan_trip_schedule, TripSegment


class HOSEngineShortTripTests(SimpleTestCase):
    def test_short_trip_no_breaks(self):
        """Short trip (3.5hr total drive) needs no breaks."""
        segments = [
            TripSegment(
                distance_miles=120, duration_hours=2.0,
                label='Current to Pickup',
            ),
            TripSegment(
                distance_miles=0, duration_hours=1.0,
                label='Loading', is_stop=True, stop_type='pickup',
            ),
            TripSegment(
                distance_miles=80, duration_hours=1.5,
                label='Pickup to Dropoff',
            ),
            TripSegment(
                distance_miles=0, duration_hours=1.0,
                label='Unloading', is_stop=True, stop_type='dropoff',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=20,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        driving_events = [
            e for e in result['events'] if e['status'] == 'driving'
        ]
        self.assertEqual(len(driving_events), 2)
        # No mandatory break needed for 3.5hr total drive
        break_events = [
            e for e in result['events']
            if e['type'] in ('break', 'rest', 'restart')
        ]
        self.assertEqual(len(break_events), 0)

    def test_has_pre_and_post_trip(self):
        """Trip should have pre-trip and post-trip inspections."""
        segments = [
            TripSegment(
                distance_miles=100, duration_hours=2.0,
                label='A to B',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=0,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        types = [e['type'] for e in result['events']]
        self.assertIn('pre_trip', types)
        self.assertIn('post_trip', types)


class HOSEngineBreakTests(SimpleTestCase):
    def test_8hr_driving_requires_break(self):
        """After 8hr cumulative driving, 30-min break required."""
        segments = [
            TripSegment(
                distance_miles=500, duration_hours=9.0,
                label='Long drive',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=0,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        break_events = [
            e for e in result['events'] if e['type'] == 'break'
        ]
        self.assertGreaterEqual(len(break_events), 1)
        # Break should be 30 min (0.5 hr)
        for brk in break_events:
            self.assertAlmostEqual(brk['duration_hours'], 0.5, places=1)


class HOSEngineRestTests(SimpleTestCase):
    def test_11hr_driving_requires_rest(self):
        """After 11hr driving, must take 10hr rest."""
        segments = [
            TripSegment(
                distance_miles=700, duration_hours=12.0,
                label='Very long drive',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=0,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        rest_events = [
            e for e in result['events'] if e['type'] == 'rest'
        ]
        self.assertGreaterEqual(len(rest_events), 1)
        self.assertAlmostEqual(
            rest_events[0]['duration_hours'], 10.0, places=0
        )


class HOSEngineCycleTests(SimpleTestCase):
    def test_cycle_exhausted_requires_34hr_restart(self):
        """When 70hr cycle nearly exhausted, 34hr restart needed."""
        segments = [
            TripSegment(
                distance_miles=300, duration_hours=5.0,
                label='Drive',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=67,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        # With 3hr cycle remaining and pre-trip eating 0.25,
        # 5hr drive needs restart
        restart_events = [
            e for e in result['events'] if e['type'] == 'restart'
        ]
        self.assertGreaterEqual(len(restart_events), 1)

    def test_cycle_fully_exhausted_restarts_before_driving(self):
        """70hr cycle fully used = restart before any driving."""
        segments = [
            TripSegment(
                distance_miles=100, duration_hours=2.0,
                label='Drive',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=70,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        restart_events = [
            e for e in result['events'] if e['type'] == 'restart'
        ]
        self.assertGreaterEqual(len(restart_events), 1)


class HOSEngineFuelTests(SimpleTestCase):
    def test_fuel_stop_every_1000_miles(self):
        """Fuel stop required at least every 1000 miles."""
        segments = [
            TripSegment(
                distance_miles=1500, duration_hours=25.0,
                label='Cross country',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=0,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        fuel_events = [
            e for e in result['events'] if e['type'] == 'fuel'
        ]
        self.assertGreaterEqual(len(fuel_events), 1)


class HOSEngineTotalTests(SimpleTestCase):
    def test_total_miles_tracked(self):
        """Total miles should be sum of all driving segments."""
        segments = [
            TripSegment(
                distance_miles=200, duration_hours=3.5,
                label='Leg 1',
            ),
            TripSegment(
                distance_miles=0, duration_hours=1.0,
                label='Stop', is_stop=True, stop_type='pickup',
            ),
            TripSegment(
                distance_miles=150, duration_hours=2.5,
                label='Leg 2',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=10,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        self.assertAlmostEqual(result['total_miles'], 350, places=0)

    def test_events_not_empty(self):
        """Result should have events."""
        segments = [
            TripSegment(
                distance_miles=100, duration_hours=2.0,
                label='Drive',
            ),
        ]
        result = plan_trip_schedule(
            segments, cycle_used=0,
            start_time=datetime(2026, 4, 24, 6, 0),
        )
        self.assertGreater(len(result['events']), 0)
