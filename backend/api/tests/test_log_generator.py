from django.test import SimpleTestCase
from api.log_generator import generate_daily_logs


class LogGeneratorSingleDayTests(SimpleTestCase):
    def test_single_day_totals_24(self):
        """Single day log sheet hours must sum to 24."""
        events = [
            {
                'start_time': '2026-04-24T06:00:00',
                'end_time': '2026-04-24T06:15:00',
                'status': 'on_duty', 'type': 'pre_trip',
                'location': 'Chicago, IL', 'miles': 0,
            },
            {
                'start_time': '2026-04-24T06:15:00',
                'end_time': '2026-04-24T12:15:00',
                'status': 'driving', 'type': 'driving',
                'location': '', 'miles': 330,
            },
            {
                'start_time': '2026-04-24T12:15:00',
                'end_time': '2026-04-24T13:15:00',
                'status': 'on_duty', 'type': 'pickup',
                'location': 'Indianapolis, IN', 'miles': 0,
            },
            {
                'start_time': '2026-04-24T13:15:00',
                'end_time': '2026-04-24T18:00:00',
                'status': 'driving', 'type': 'driving',
                'location': '', 'miles': 250,
            },
            {
                'start_time': '2026-04-24T18:00:00',
                'end_time': '2026-04-24T18:15:00',
                'status': 'on_duty', 'type': 'post_trip',
                'location': 'Nashville, TN', 'miles': 0,
            },
        ]
        logs = generate_daily_logs(events)
        self.assertEqual(len(logs), 1)
        totals = logs[0]['totals']
        total_sum = (
            totals['off_duty'] + totals['sleeper']
            + totals['driving'] + totals['on_duty']
        )
        self.assertAlmostEqual(total_sum, 24.0, places=1)

    def test_totals_include_driving_miles(self):
        """Total miles should reflect driving events."""
        events = [
            {
                'start_time': '2026-04-24T06:00:00',
                'end_time': '2026-04-24T10:00:00',
                'status': 'driving', 'type': 'driving',
                'location': '', 'miles': 220,
            },
        ]
        logs = generate_daily_logs(events)
        self.assertEqual(logs[0]['total_miles'], 220)

    def test_remarks_generated_for_located_events(self):
        """Remarks should be generated for events with locations."""
        events = [
            {
                'start_time': '2026-04-24T06:00:00',
                'end_time': '2026-04-24T06:15:00',
                'status': 'on_duty', 'type': 'pre_trip',
                'location': 'Chicago, IL', 'miles': 0,
            },
        ]
        logs = generate_daily_logs(events)
        self.assertGreater(len(logs[0]['remarks']), 0)
        self.assertEqual(logs[0]['remarks'][0]['location'], 'Chicago, IL')


class LogGeneratorMultiDayTests(SimpleTestCase):
    def test_multi_day_split(self):
        """Events spanning midnight produce multiple log sheets."""
        events = [
            {
                'start_time': '2026-04-24T20:00:00',
                'end_time': '2026-04-25T06:00:00',
                'status': 'sleeper', 'type': 'rest',
                'location': '', 'miles': 0,
            },
            {
                'start_time': '2026-04-25T06:00:00',
                'end_time': '2026-04-25T12:00:00',
                'status': 'driving', 'type': 'driving',
                'location': '', 'miles': 300,
            },
        ]
        logs = generate_daily_logs(events)
        self.assertEqual(len(logs), 2)

    def test_each_day_sums_to_24(self):
        """Each day in a multi-day trip should sum to 24 hours."""
        events = [
            {
                'start_time': '2026-04-24T20:00:00',
                'end_time': '2026-04-25T06:00:00',
                'status': 'sleeper', 'type': 'rest',
                'location': '', 'miles': 0,
            },
            {
                'start_time': '2026-04-25T06:00:00',
                'end_time': '2026-04-25T12:00:00',
                'status': 'driving', 'type': 'driving',
                'location': '', 'miles': 300,
            },
        ]
        logs = generate_daily_logs(events)
        for log in logs:
            total = sum(log['totals'].values())
            self.assertAlmostEqual(
                total, 24.0, places=1,
                msg=f"Day {log['date']} totals {total}, not 24.0",
            )

    def test_empty_events(self):
        """Empty events list should return empty logs."""
        logs = generate_daily_logs([])
        self.assertEqual(len(logs), 0)
