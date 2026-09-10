import importlib.util
import unittest
from unittest.mock import patch
from pathlib import Path

spec = importlib.util.spec_from_file_location('refresh', Path(__file__).resolve().parents[1] / 'scripts/refresh.py')
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

class CollectionTests(unittest.TestCase):
    def test_failure_preserves_historical_data_and_time(self):
        old = dict(id='a/b', name='a/b', first_seen='2020-01-01', observed_at='2020-01-01', pushed_at='2020-01-01')
        with patch.object(refresh, 'api', side_effect=RuntimeError('offline')), patch.object(refresh.urllib.request, 'urlopen', side_effect=OSError()):
            result = refresh.collect({'repositories':[old]})
        self.assertEqual(result['repositories'], [old])
        self.assertEqual(result['changes'], [])
        self.assertTrue(result['errors'])

    def test_total_failure_without_baseline_does_not_make_empty_snapshot(self):
        with patch.object(refresh, 'api', side_effect=RuntimeError('offline')):
            with self.assertRaises(RuntimeError):
                refresh.collect({})

    def test_duplicate_repository_and_first_seen(self):
        repo = dict(full_name='A/B', html_url='https://github.com/A/B', description='test', stargazers_count=1, pushed_at='2026-01-01', created_at='2025-01-01', fork=False, archived=False)
        with patch.object(refresh, 'api', side_effect=[repo,dict(total_count=1,items=[repo])]), patch.object(refresh.urllib.request, 'urlopen', side_effect=OSError()):
            result = refresh.collect({'repositories':[dict(id='a/b',first_seen='2025-02-01')]})
        self.assertEqual(len(result['repositories']), 1)
        self.assertEqual(result['repositories'][0]['first_seen'], '2025-02-01')
        self.assertEqual(result['changes'], [])

if __name__ == '__main__':
    unittest.main()
