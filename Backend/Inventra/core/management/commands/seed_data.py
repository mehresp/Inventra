"""
Management command to seed database with initial data.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta

from core.models import (
    Role, UserProfile, Category, Item, Warehouse, StockLot,
    Movement, Requisition, RequisitionLine, Supplier
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with initial test data'

    def handle(self, *args, **options):
        self.stdout.write('Starting database seeding...')

        # Create Roles
        self.stdout.write('Creating roles...')
        admin_role, _ = Role.objects.get_or_create(name=Role.Name.ADMIN)
        storekeeper_role, _ = Role.objects.get_or_create(name=Role.Name.STOREKEEPER)
        requester_role, _ = Role.objects.get_or_create(name=Role.Name.REQUESTER)
        auditor_role, _ = Role.objects.get_or_create(name=Role.Name.AUDITOR)

        # Create Users
        self.stdout.write('Creating users...')
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@inventra.local',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_user.username}'))
        admin_user.set_password('admin123')
        admin_user.save()
        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={'for_role': admin_role}
        )

        storekeeper_user, created = User.objects.get_or_create(
            username='storekeeper',
            defaults={
                'email': 'storekeeper@inventra.local',
                'first_name': 'Store',
                'last_name': 'Keeper',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created storekeeper user: {storekeeper_user.username}'))
        storekeeper_user.set_password('storekeeper123')
        storekeeper_user.save()
        UserProfile.objects.get_or_create(
            user=storekeeper_user,
            defaults={'for_role': storekeeper_role}
        )

        requester_user, created = User.objects.get_or_create(
            username='requester',
            defaults={
                'email': 'requester@inventra.local',
                'first_name': 'Request',
                'last_name': 'User',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created requester user: {requester_user.username}'))
        requester_user.set_password('requester123')
        requester_user.save()
        UserProfile.objects.get_or_create(
            user=requester_user,
            defaults={'for_role': requester_role}
        )

        auditor_user, created = User.objects.get_or_create(
            username='auditor',
            defaults={
                'email': 'auditor@inventra.local',
                'first_name': 'Audit',
                'last_name': 'User',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created auditor user: {auditor_user.username}'))
        auditor_user.set_password('auditor123')
        auditor_user.save()
        UserProfile.objects.get_or_create(
            user=auditor_user,
            defaults={'for_role': auditor_role}
        )

        # Create Categories
        self.stdout.write('Creating categories...')
        categories_data = [
            {'name': 'Electronics'},
            {'name': 'Office Supplies'},
            {'name': 'Lab Equipment'},
            {'name': 'Chemicals'},
            {'name': 'Tools'},
        ]
        categories = []
        for cat_data in categories_data:
            cat, _ = Category.objects.get_or_create(**cat_data)
            categories.append(cat)
            self.stdout.write(self.style.SUCCESS(f'Created category: {cat.name}'))

        # Create Warehouses
        self.stdout.write('Creating warehouses...')
        warehouses_data = [
            {'name': 'Main Warehouse', 'location': 'Building A, Floor 1'},
            {'name': 'Lab Warehouse', 'location': 'Building B, Floor 2'},
            {'name': 'Office Warehouse', 'location': 'Building C, Floor 1'},
        ]
        warehouses = []
        for wh_data in warehouses_data:
            wh, _ = Warehouse.objects.get_or_create(**wh_data)
            warehouses.append(wh)
            self.stdout.write(self.style.SUCCESS(f'Created warehouse: {wh.name}'))

        # Create Items
        self.stdout.write('Creating items...')
        items_data = [
            {'code': 'LAP001', 'name': 'Laptop', 'unit': 'unit', 'min_stock': 5, 'category': categories[0]},
            {'code': 'MON001', 'name': 'Monitor', 'unit': 'unit', 'min_stock': 10, 'category': categories[0]},
            {'code': 'PEN001', 'name': 'Pen', 'unit': 'box', 'min_stock': 20, 'category': categories[1]},
            {'code': 'PAP001', 'name': 'A4 Paper', 'unit': 'ream', 'min_stock': 50, 'category': categories[1]},
            {'code': 'BEA001', 'name': 'Beaker 500ml', 'unit': 'unit', 'min_stock': 15, 'category': categories[2]},
            {'code': 'BEA002', 'name': 'Beaker 1000ml', 'unit': 'unit', 'min_stock': 10, 'category': categories[2]},
            {'code': 'CHM001', 'name': 'Sodium Chloride', 'unit': 'kg', 'min_stock': 5, 'category': categories[3]},
            {'code': 'CHM002', 'name': 'Distilled Water', 'unit': 'liter', 'min_stock': 100, 'category': categories[3]},
            {'code': 'TOO001', 'name': 'Screwdriver Set', 'unit': 'set', 'min_stock': 5, 'category': categories[4]},
            {'code': 'TOO002', 'name': 'Wrench Set', 'unit': 'set', 'min_stock': 3, 'category': categories[4]},
        ]
        items = []
        for item_data in items_data:
            item, _ = Item.objects.get_or_create(
                code=item_data['code'],
                defaults={
                    'name': item_data['name'],
                    'unit': item_data['unit'],
                    'min_stock': item_data['min_stock'],
                    'for_category': item_data['category'],
                }
            )
            items.append(item)
            self.stdout.write(self.style.SUCCESS(f'Created item: {item.code} - {item.name}'))

        # Create Stock Lots
        self.stdout.write('Creating stock lots...')
        lots_created = 0
        for i, item in enumerate(items[:6]):  # Create lots for first 6 items
            for j, warehouse in enumerate(warehouses):
                expiry_date = timezone.now().date() + timedelta(days=30 * (i + j + 1))
                lot, _ = StockLot.objects.get_or_create(
                    for_item=item,
                    for_warehouse=warehouse,
                    batch_no=f'BATCH-{item.code}-{warehouse.name[:3]}-{j+1}',
                    defaults={
                        'expiry_date': expiry_date if i < 3 else None,  # Only some items have expiry
                        'qty': Decimal(str((i + j + 1) * 10)),
                    }
                )
                lots_created += 1
        self.stdout.write(self.style.SUCCESS(f'Created {lots_created} stock lots'))

        # Create Movements
        self.stdout.write('Creating movements...')
        movements_created = 0
        for i, item in enumerate(items[:5]):
            warehouse = warehouses[0]
            # Create IN movements
            Movement.objects.get_or_create(
                type=Movement.Type.IN,
                ref_type=Movement.RefType.OTHER,
                ref_no=f'INIT-{item.code}',
                for_item=item,
                for_warehouse_to=warehouse,
                defaults={
                    'qty': Decimal(str((i + 1) * 50)),
                    'for_actor': admin_user,
                    'notes': 'Initial stock',
                }
            )
            movements_created += 1
        self.stdout.write(self.style.SUCCESS(f'Created {movements_created} movements'))

        # Create Requisitions
        self.stdout.write('Creating requisitions...')
        requisitions_created = 0
        for i in range(3):
            req_no = f'REQ-{timezone.now().strftime("%Y%m%d")}-{i+1:03d}'
            requisition, created = Requisition.objects.get_or_create(
                req_no=req_no,
                defaults={
                    'for_requester': requester_user,
                    'dept_lab': Requisition.DeptLab.CHEMISTRY if i == 0 else Requisition.DeptLab.BIOLOGY if i == 1 else Requisition.DeptLab.PHYSICS,
                    'status': Requisition.Status.PENDING if i == 0 else Requisition.Status.APPROVED if i == 1 else Requisition.Status.DRAFT,
                    'needed_by': timezone.now().date() + timedelta(days=7),
                    'notes': f'Sample requisition {i+1}',
                }
            )
            if created:
                # Add lines to requisition
                for j in range(2):
                    RequisitionLine.objects.create(
                        for_requisition=requisition,
                        for_item=items[j],
                        requested_qty=Decimal(str((j + 1) * 5)),
                        approved_qty=Decimal(str((j + 1) * 5)) if i == 1 else Decimal('0'),
                    )
                if i == 1:
                    requisition.for_approved_by = storekeeper_user
                    requisition.save()
                requisitions_created += 1
                self.stdout.write(self.style.SUCCESS(f'Created requisition: {requisition.req_no}'))

        # Create Suppliers
        self.stdout.write('Creating suppliers...')
        suppliers_data = [
            {'name': 'Tech Supplies Inc.', 'contact': 'contact@techsupplies.com'},
            {'name': 'Lab Equipment Co.', 'contact': 'sales@labeq.com'},
            {'name': 'Office Depot', 'contact': 'orders@officedepot.com'},
        ]
        for sup_data in suppliers_data:
            supplier, _ = Supplier.objects.get_or_create(**sup_data)
            self.stdout.write(self.style.SUCCESS(f'Created supplier: {supplier.name}'))

        self.stdout.write(self.style.SUCCESS('\nDatabase seeding completed successfully!'))
        self.stdout.write(self.style.SUCCESS('\nSample users created:'))
        self.stdout.write(self.style.SUCCESS('  - admin / admin123'))
        self.stdout.write(self.style.SUCCESS('  - storekeeper / storekeeper123'))
        self.stdout.write(self.style.SUCCESS('  - requester / requester123'))
        self.stdout.write(self.style.SUCCESS('  - auditor / auditor123'))

