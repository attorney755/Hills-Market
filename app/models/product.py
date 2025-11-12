from app import db
from datetime import datetime
import json

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(10, 2))
    location = db.Column(db.String(255), nullable=True)
    image_urls = db.Column(db.JSON)  # Store as JSON array
    contact_info = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_sold = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert product object to dictionary"""
        try:
            from app.models.user import User
            from app.models.category import Category
            from flask import current_app
        
            print(f"🔄 Converting product {self.id} to dict - Name: {self.name}")
            
            # Ensure image_urls is always a list and properly formatted
            image_urls = self.image_urls or []
            
            # If it's a string, convert to list
            if isinstance(image_urls, str):
                try:
                    # Try to parse as JSON string
                    image_urls = json.loads(image_urls)
                except:
                    # If not JSON, split by commas or handle as single item
                    if ',' in image_urls:
                        image_urls = [url.strip() for url in image_urls.split(',') if url.strip()]
                    else:
                        image_urls = [image_urls] if image_urls.strip() else []
            
            # Ensure it's a list
            if not isinstance(image_urls, list):
                image_urls = []
            
            # Clean and validate image URLs
            processed_urls = []
            for url in image_urls:
                if url and isinstance(url, str):
                    # Clean the URL - remove any malformed data
                    url = url.strip()
                    
                    # Skip placeholder URLs that are causing errors
                    if 'via.placeholder.com' in url:
                        print(f"⚠️ Skipping placeholder URL: {url}")
                        continue
                        
                    # Fix malformed URLs (like the one with spaces and dates)
                    if 'Screenshot from' in url:
                        print(f"⚠️ Found malformed URL, skipping: {url}")
                        continue
                    
                    # Handle relative URLs
                    if url.startswith('/uploads/'):
                        # Use configuration for base URL instead of hardcoding
                        base_url = current_app.config.get('BASE_URL', 'http://127.0.0.1:5000')
                        processed_urls.append(f"{base_url}{url}")
                    elif url.startswith('uploads/'):
                        base_url = current_app.config.get('BASE_URL', 'http://127.0.0.1:5000')
                        processed_urls.append(f"{base_url}/{url}")
                    elif url.startswith(('http://', 'https://')):
                        # Only keep valid external URLs
                        processed_urls.append(url)
                    else:
                        # Skip invalid URLs
                        print(f"⚠️ Skipping invalid URL format: {url}")
            
            # Get seller and category
            seller = User.query.get(self.user_id)
            category = Category.query.get(self.category_id)
            
            # Format price in RWF
            price_display = None
            if self.price:
                price_value = float(self.price)
                price_display = f"RWF {price_value:,.0f}".replace(',', ' ')
        
            result = {
                'id': self.id,
                'user_id': self.user_id,
                'category_id': self.category_id,
                'name': self.name,
                'description': self.description,
                'price': float(self.price) if self.price else None,
                'price_display': price_display,  # Add this field
                'location': self.location,  # ADD THIS LINE
                'image_urls': processed_urls,
                'contact_info': self.contact_info,
                'is_active': self.is_active,
                'is_sold': self.is_sold,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None,
                'seller_username': seller.username if seller else 'Unknown',
                'category_name': category.name if category else 'Uncategorized'
            }
            
            print(f"✅ Product {self.id} converted successfully with {len(processed_urls)} images")
            return result
            
        except Exception as e:
            print(f"❌ Error converting product {self.id} to dict: {str(e)}")
            # Return basic data even if there's an error
            return {
                'id': self.id,
                'name': self.name or 'Unknown Product',
                'description': self.description or 'No description',
                'price': float(self.price) if self.price else None,
                'price_display': f"RWF {float(self.price):,.0f}".replace(',', ' ') if self.price else None,
                'location': self.location,  # ADD THIS LINE
                'image_urls': [],
                'contact_info': self.contact_info or 'No contact info',
                'is_active': self.is_active,
                'seller_username': 'Unknown',
                'category_name': 'Uncategorized',
                'error': str(e)
            }