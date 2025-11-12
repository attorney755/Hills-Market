# manual_setup.py
import psycopg2
from app import create_app, db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.notification import Notification

def setup_database():
    """Set up database tables and initial data"""
    app = create_app()
    
    with app.app_context():
        try:
            # Drop all tables and recreate
            db.drop_all()
            db.create_all()
            
            print("✅ Tables created successfully!")
            
            # Insert default categories
            categories = [
                ('Electronics', 'Phones, laptops, gadgets and accessories'),
                ('Fashion', 'Clothing, shoes, and accessories'),
                ('Home & Garden', 'Furniture, decor, and garden items'),
                ('Vehicles', 'Cars, motorcycles, and vehicles'),
                ('Real Estate', 'Houses, apartments, and properties'),
                ('Services', 'Various services offered'),
                ('Other', 'Other miscellaneous items')
            ]
            
            for name, description in categories:
                category = Category(name=name, description=description)
                db.session.add(category)
            
            # Create admin user
            admin = User(
                username='admin',
                email='admin@marketplace.com',
                is_admin=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            
            # Create sample regular user
            user = User(
                username='testuser',
                email='test@example.com'
            )
            user.set_password('test123')
            db.session.add(user)
            
            db.session.commit()
            
            print("✅ Default categories added!")
            print("✅ Admin user created: admin@marketplace.com / admin123")
            print("✅ Test user created: test@example.com / test123")
            
            # Verify the setup
            user_count = User.query.count()
            category_count = Category.query.count()
            
            print(f"📊 Database stats: {user_count} users, {category_count} categories")
            
        except Exception as e:
            print(f"❌ Error during setup: {e}")
            db.session.rollback()

if __name__ == '__main__':
    setup_database()