# Running and developing the application

The Dockerfile uses Python 3.13; dependencies are in `chatapp/requirements.txt`. Settings hardcode the Compose hostnames `postgres`/`redis`; a virtualenv and runserver outside Docker are not sufficient. The commands below require Compose v2 and a running Docker daemon. Check network permissions when building images/installing packages.

## Local development

From `chatapp/`:

```sh
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 web worker
```

The web service runs collectstatic/migrate automatically. PostgreSQL bind-mounts `./data/postgres`: select the correct local data before starting. The current depends_on configuration does not guarantee DB readiness; inspect logs and readiness before restarting a failed service. HTTP/WS uses port 8000. Create a local account when needed:

```sh
docker compose exec web python manage.py createsuperuser
```

Do not store account credentials/tokens in the repository.

## Testing with isolated data

Copy the backend to a temporary directory so Compose does not mount the existing DB. Run from the repository root in the same shell:

```sh
task_test_dir=$(mktemp -d /tmp/chatapp-agent-test.XXXXXX)
task_compose_project="chatapp-test-$(date +%s)"
rsync -a --exclude=data --exclude=staticfiles --exclude=__pycache__ --exclude=.env chatapp/ "$task_test_dir/"
cd "$task_test_dir"
docker compose -p "$task_compose_project" build web
docker compose -p "$task_compose_project" up -d postgres redis
docker compose -p "$task_compose_project" exec postgres pg_isready -U chatuser -d chatscale
docker compose -p "$task_compose_project" exec redis redis-cli ping
docker compose -p "$task_compose_project" run --rm --no-deps web python manage.py check
docker compose -p "$task_compose_project" run --rm --no-deps web python manage.py test chat quickstart --verbosity 2
```

If readiness checks fail, wait briefly and check again. `run` does not publish the web port. Django creates a separate test DB on the temporary stack's PostgreSQL instance. Record the project name/directory so work can resume if the shell session is lost. After source/migration changes, copy the updated source before verification.

When finished, run from the correct temporary directory with the correct project name:

```sh
docker compose -p "$task_compose_project" down
```

Keep test data if needed for investigation; cleanup must target only the temporary stack/directory just created, not prune the entire system.

## Migrations and seed data

From `chatapp/`, with the appropriate local stack running:

```sh
docker compose exec web python manage.py makemigrations chat
docker compose exec web python manage.py makemigrations --check --dry-run
docker compose exec web python manage.py showmigrations
```

Select the app that actually changed. Create migrations in the real checkout, read the new files, and inspect defaults/nullability/constraints/locks and existing data. Test migrations on a separate DB before applying them to data in use. The bind mount must allow migration files to be written.

Read `chat/management/commands/seed_messages.py` before seeding. Seed/k6 scripts create and may delete data; use only a disposable environment. Refer to the script for k6 accounts/variables; update the script when its contract changes.

## Frontend/site

The frontend lacks package.json/application source; T001 restores them from a source/history supported by evidence. Do not edit minified bundles or guess npm scripts. After restoration, add instructions based on the actual manifest.

The `production-roadmap/` site is separate from ChatApp. Its generator requires ROADMAP/TODO from the parent repository; read the caveat in WORKFLOW before rebuilding. Use the available Sites skill for hosting and preserve the separate Git repository/manifest.

These commands were checked against configuration but were not executed at runtime when this document was written. Report the actual results of each execution.
