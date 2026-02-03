# Generated manually for fixing AuditLog.entity_id (UUID -> CharField)
# so that integer PKs from Item, Warehouse, etc. can be stored.

from django.db import migrations, models


def uuid_to_str(apps, schema_editor):
    """Convert existing UUID entity_id values to string (for DBs that need it)."""
    # PostgreSQL AlterField with USING handles conversion; this is for SQLite or if needed
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auditlog',
            name='entity_id',
            field=models.CharField(max_length=64),
        ),
    ]
