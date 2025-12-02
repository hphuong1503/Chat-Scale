


# Restart Django server if running
python manage.py runserver

# Test the API with curl
curl -X POST http://localhost:8000/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Run k6 test
k6 run k6-test.js

# Install pip
pip install --no-cache-dir -r requirements.txt

# Migrate database
python manage.py makemigration
python manage.py migrate

# Activate virtual environment
# macOS / Linux
source venv/bin/activate


# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
python manage.py runserver


# Seed messsage
python manage.py seed_messages admin

# Create superuser
python manage.py createsuperuser 

# Docker compose
docker-compose up --build -d
# To stop Docker containers
docker-compose down
# To view logs
docker-compose logs -f
# To view running containers
docker ps
# To stop a specific container
docker stop <container_id>

# To remove a specific container
docker rm <container_id>

# To remove all stopped containers
docker container prune


