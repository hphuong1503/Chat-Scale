"""Check the document contract; evidence correctness still requires review."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "spec.md": ("Intent", "Scope", "Contract", "Acceptance criteria", "Open questions"),
    "plan.md": ("Approach", "Verification", "Rollout and rollback"),
    "tasks.md": (),
    "evidence.md": ("Acceptance mapping", "Runs", "Limitations"),
}
STATES = {"Draft", "Ready", "In progress", "Implemented", "Superseded"}


def validate(root):
    errors = []
    directories = sorted(path for path in (root / "specs").glob("[0-9]*") if path.is_dir())
    if not directories:
        return ["No numbered specs found"]
    registry = root / "specs" / "README.md"
    registry_text = registry.read_text() if registry.exists() else ""
    for directory in directories:
        prefix = directory.name
        if f"({prefix}/spec.md)" not in registry_text:
            errors.append(f"{prefix}: missing registry link")
        documents = {}
        for filename, headings in REQUIRED.items():
            path = directory / filename
            content = path.read_text() if path.exists() else ""
            documents[filename] = content
            if not content.strip():
                errors.append(f"{prefix}/{filename}: missing or empty")
            for heading in headings:
                if f"## {heading}" not in content.splitlines():
                    errors.append(f"{prefix}/{filename}: missing heading {heading}")
        spec = documents["spec.md"]
        statuses = re.findall(r"^Status: (.+)$", spec, re.M)
        status = statuses[0] if len(statuses) == 1 else None
        if status not in STATES:
            errors.append(f"{prefix}: exactly one valid Status is required")
        ids = re.findall(r"^- (AC-\d{3}): .+", spec, re.M)
        if not ids or len(ids) != len(set(ids)):
            errors.append(f"{prefix}: acceptance IDs must be present and unique")
        evidence = documents["evidence.md"]
        for criterion in ids:
            rows = re.findall(rf"^\| {criterion} \| (.+) \| ([^|]+) \|$", evidence, re.M)
            if len(rows) != 1:
                errors.append(f"{prefix}: {criterion} needs exactly one evidence row")
            elif status == "Implemented" and rows[0][1].strip() != "Pass":
                errors.append(f"{prefix}: {criterion} is not Pass")
        if status == "Implemented" and "- [ ]" in documents["tasks.md"]:
            errors.append(f"{prefix}: Implemented spec has unfinished tasks")
    return errors


if __name__ == "__main__":
    problems = validate(ROOT)
    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        sys.exit(1)
    print("Spec structure and acceptance mappings: OK (semantic review still required)")
