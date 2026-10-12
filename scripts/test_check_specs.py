"""Regression checks for the spec gate, using disposable document fixtures."""
import shutil
import re
import tempfile
import unittest
from pathlib import Path

from check_specs import ROOT, validate


class SpecGateTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        directory = self.root / "specs/999-fixture"
        shutil.copytree(ROOT / "specs/_template", directory)
        (directory.parent / "README.md").write_text("[Fixture](999-fixture/spec.md)\n")
        self.spec = directory / "spec.md"
        text = self.spec.read_text()
        self.spec.write_text(re.sub(r"^Status: .+$", "Status: Ready", text, flags=re.M))

    def test_valid_documents(self):
        self.assertEqual(validate(self.root), [])

    def test_invalid_status(self):
        self.spec.write_text(self.spec.read_text().replace("Status: Ready", "Status: Unknown"))
        self.assertTrue(any("valid Status" in error for error in validate(self.root)))

    def test_duplicate_acceptance_id(self):
        self.spec.write_text(self.spec.read_text() + "\n- AC-001: Duplicate criterion\n")
        self.assertTrue(any("unique" in error for error in validate(self.root)))

    def test_missing_evidence_mapping(self):
        path = self.spec.parent / "evidence.md"
        path.write_text(path.read_text().replace("| AC-001 |", "| MISSING |"))
        self.assertTrue(any("AC-001 needs" in error for error in validate(self.root)))

    def test_missing_plan(self):
        (self.spec.parent / "plan.md").unlink()
        self.assertTrue(any("plan.md: missing or empty" in error for error in validate(self.root)))

    def test_implemented_requires_passing_evidence_and_finished_tasks(self):
        self.spec.write_text(self.spec.read_text().replace("Status: Ready", "Status: Implemented"))
        evidence = self.spec.parent / "evidence.md"
        evidence.write_text(re.sub(r"(\| AC-001 \| .+ \| )[^|]+( \|)", r"\1Pending\2", evidence.read_text()))
        (self.spec.parent / "tasks.md").write_text("# Tasks\n\n- [ ] Outstanding work\n")
        errors = validate(self.root)
        self.assertTrue(any("not Pass" in error for error in errors))
        self.assertTrue(any("unfinished tasks" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
