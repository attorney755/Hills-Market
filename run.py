from app import create_app
import os

app = create_app(os.getenv('FLASK_ENV', 'production'))

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(os.path.join(uploads_dir, 'products'), exist_ok=True)
    
    # Get port from environment variable (required by hosting platforms)
    port = int(os.environ.get('PORT', 5000))
    
    print("🚀 Marketplace API Server Starting...")
    print("📁 Uploads directory:", uploads_dir)
    print("🌐 Server running on http://0.0.0.0:" + str(port))
    print("🔧 Debug mode:", os.environ.get('DEBUG', 'False'))
    print("🏷️ Environment:", os.getenv('FLASK_ENV', 'production'))
    
    # Don't use debug=True in production
    debug_mode = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
