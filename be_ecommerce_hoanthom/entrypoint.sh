#!/bin/sh
set -e

echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."
until python -c "
import os, sys
import MySQLdb
try:
    MySQLdb.connect(
        host=os.environ['DB_HOST'],
        port=int(os.environ['DB_PORT']),
        user=os.environ['DB_USER'],
        passwd=os.environ['DB_PASSWORD'],
        db=os.environ['DB_NAME'],
    )
except Exception as e:
    print(e)
    sys.exit(1)
"; do
  sleep 2
done
echo "MySQL is up."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
