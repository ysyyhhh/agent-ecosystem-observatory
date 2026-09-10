import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / 'data/intelligence.json').read_text(encoding='utf-8'))

    def test_every_claim_resolves_to_sources_and_capabilities(self):
        build.validate_intelligence(self.data)

    def test_missing_source_is_rejected(self):
        broken = copy.deepcopy(self.data)
        broken['products'][0]['mappings'][0]['providers'].append('invented-source')
        with self.assertRaises(AssertionError):
            build.validate_intelligence(broken)

    def test_unqualified_equivalence_is_rejected(self):
        self.data['products'][0]['mappings'][0]['gap'] = ''
        with self.assertRaises(AssertionError):
            build.validate_intelligence(self.data)

    def test_unverified_media_date_stays_unknown(self):
        post = next(x for x in self.data['media'] if x['id']=='x-launch')
        self.assertIsNone(post['date'])
        self.assertIn('reddit-launch', post['sources'])

if __name__ == '__main__':
    unittest.main()
