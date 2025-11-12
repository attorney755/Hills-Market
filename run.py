from app import create_app
import os

app = create_app(os.getenv('FLASK_ENV', 'default'))

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(os.path.join(uploads_dir, 'products'), exist_ok=True)
    
    print("🚀 Marketplace API Server Starting...")
    print("📁 Uploads directory:", uploads_dir)
    print("📁 Products upload directory:", os.path.join(uploads_dir, 'products'))
    print("🌐 Server running on http://0.0.0.0:5000")
    print("🔧 Debug mode: ON")
    
    app.run(host='0.0.0.0', port=5000, debug=True)