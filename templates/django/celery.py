from __future__ import absolute_import
import os
from celery import Celery
from django.conf import settings

# Indicate Celery to use the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '{{project.slug}}.settings')

app = Celery('{{project.slug}}')
app.config_from_object('django.conf:settings')
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)
