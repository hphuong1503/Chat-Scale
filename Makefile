PYTHON ?= python3
SETTINGS = chatapp.settings_test

.PHONY: check test backend-check frontend-check spec-check
check: spec-check backend-check test frontend-check

spec-check:
	$(PYTHON) scripts/check_specs.py
	$(PYTHON) -m unittest discover -s scripts -p 'test_*.py'

backend-check:
	$(PYTHON) chatapp/manage.py check --settings=$(SETTINGS)
	$(PYTHON) chatapp/manage.py makemigrations --check --dry-run --settings=$(SETTINGS)

test:
	$(PYTHON) chatapp/manage.py test chat quickstart --settings=$(SETTINGS) --noinput

frontend-check:
	cd frontend && npm run typecheck && npm test && npm run build
