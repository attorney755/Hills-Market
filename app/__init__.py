from flask import Flask, send_from_directory, jsonify, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_migrate import Migrate
from flask_mail import Mail
import os

# Initialize extensions
db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()
cors = CORS()
mail = Mail()

def create_app(config_name='default'):
    """Application factory"""
    app = Flask(__name__,
                static_folder='../frontend',  # ADD THIS
                template_folder='../frontend')  # ADD THIS

    print(f"🚀 Loading configuration: {config_name}")

    try:
        # Import and use the config from root directory
        from config import config as config_dict

        config_obj = config_dict[config_name]
        app.config.from_object(config_obj)
        print("✅ Configuration loaded successfully from config.py")

        # Debug: Print key configurations
        print("📋 CONFIGURATION DETAILS:")
        print(f"   DATABASE: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Not set')}")
        print(f"   MAIL_SERVER: {app.config.get('MAIL_SERVER', 'Not set')}")
        print(f"   MAIL_USERNAME: {app.config.get('MAIL_USERNAME', 'Not set')}")
        print(f"   MAIL_PASSWORD_SET: {bool(app.config.get('MAIL_PASSWORD', ''))}")

    except ImportError as e:
        print(f"❌ Cannot import config: {e}")
        print("   Make sure config.py is in the same directory as run.py")
        # Fallback configuration
        app.config['SECRET_KEY'] = 'fallback-secret-key'
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///marketplace.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_SECRET_KEY'] = 'fallback-jwt-secret'
    except KeyError as e:
        print(f"❌ Config '{config_name}' not found: {e}")
    except Exception as e:
        print(f"❌ Error loading configuration: {e}")

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    # Configure CORS
    cors.init_app(app,
        resources={
            r"/*": {
                "origins": ["http://127.0.0.1:3000", "http://localhost:3000", "null", "*"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "Accept"],
                "expose_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
                "max_age": 600
            }
        }
    )

    @app.route('/')
    def serve_frontend():
        return send_from_directory(app.template_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        # Try to serve static files first
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # If not found, serve index.html (for frontend routing)
        return send_from_directory(app.template_folder, 'index.html')

    # Uploads route - PRODUCTION READY
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        """Serve uploaded files - PRODUCTION READY"""
        try:
            # Use absolute path for production
            uploads_dir = os.path.join(app.root_path, 'uploads')
            os.makedirs(uploads_dir, exist_ok=True)
            os.makedirs(os.path.join(uploads_dir, 'products'), exist_ok=True)

            file_path = os.path.join(uploads_dir, filename)
            if os.path.exists(file_path):
                return send_from_directory(os.path.dirname(file_path), os.path.basename(file_path))
            return "File not found", 404
        except Exception as e:
            print(f"❌ Error serving upload: {str(e)}")
            return "Error serving file", 500

    # Import and register blueprints
    from app.routes.contact import contact_bp
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.categories import categories_bp
    from app.routes.notifications import notifications_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(contact_bp, url_prefix='/api/contact')

    # Health check
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'Marketplace API'})

    return app
