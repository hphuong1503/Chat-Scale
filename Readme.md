# ChatApp

Django/DRF chat backend with Channels, Celery, PostgreSQL and Redis.

## Start here

- [Development workflow](docs/development-workflow.md): spec → plan → tasks → implementation → evidence.
- [Spec registry](specs/README.md): implemented foundation and next feature.
- [Current system](docs/current-system.md): observed behavior and known gaps.
- [Product scope](docs/product-scope.md): working scope and unresolved decisions.
- [Roadmap](ROADMAP.md) and [backlog](TODO.md): future work, not implementation status.

## Run checks from the repository root

Use Python 3.13 (matching the backend image and CI):

```sh
python3.13 -m venv .venv
.venv/bin/python -m pip install -r chatapp/requirements.txt
make check PYTHON=.venv/bin/python
```

If the existing local `env` already has dependencies:

```sh
make check PYTHON=env/bin/python
```

`make check` validates spec structure, runs Django checks, detects missing migrations,
and runs backend tests with an in-memory SQLite DB and isolated Celery/Channels.
It does not start development services or touch their database files.
CI uses a disposable PostgreSQL 15 service with the same command. See
[verification limits](docs/development-workflow.md#verification).

## Run development services

```sh
cd chatapp
docker compose up --build -d
docker compose logs -f web worker
```

The API is available at `http://localhost:8000/`. Compose runs migrations at startup.
On an existing checkout, it mounts `chatapp/data/postgres`; preserve that data before
changing this environment. Use `docker compose down` to stop services.

```sh
docker compose exec web python manage.py createsuperuser
```

`POST /auth/login/` accepts `username` and `password` and returns access/refresh JWTs.
Send `Authorization: Bearer <access>` to authenticated REST endpoints.
The current WS URL is `/ws/chat/<room_id>/?token=<access>`.
These are development settings, not a production deployment recipe.

Frontend development/build is blocked: source files and `package.json` are missing
(T001). Existing `frontend/dist` is a generated artifact.
`k6-test.js` is a separate development load script that creates/deletes rooms and
checks HTTP queue acceptance; it is not part of the isolated test suite.
