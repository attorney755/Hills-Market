from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.product import Product
from app.models.category import Category
from app.models.user import User
from app.utils.auth import token_required
from datetime import datetime
import os
import uuid
import json  # ADD THIS IMPORT
from werkzeug.utils import secure_filename

import os

def delete_product_images(image_urls):
    """Delete physical image files from uploads folder"""
    try:
        deleted_files = []
        for image_url in image_urls:
            if image_url and isinstance(image_url, str):
                # Extract filename from URL
                if image_url.startswith('/uploads/products/'):
                    filename = image_url.split('/')[-1]
                    file_path = os.path.join('uploads', 'products', filename)
                elif image_url.startswith('http') and '/uploads/products/' in image_url:
                    filename = image_url.split('/uploads/products/')[-1]
                    file_path = os.path.join('uploads', 'products', filename)
                else:
                    continue
                
                # Delete the file if it exists
                if os.path.exists(file_path):
                    os.remove(file_path)
                    deleted_files.append(filename)
                    print(f"✅ Deleted image file: {filename}")
                else:
                    print(f"⚠️ Image file not found: {file_path}")
        
        print(f"🗑️ Cleaned up {len(deleted_files)} image files")
        return deleted_files
        
    except Exception as e:
        print(f"❌ Error deleting image files: {str(e)}")
        return []


# Create the blueprint first
products_bp = Blueprint('products', __name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@products_bp.route('/', methods=['GET'])
def get_products():
    """Get all active products with optional filtering"""
    try:
        print("🔍 GET /products endpoint called")
        
        # Get query parameters
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        print(f"📊 Query params - category_id: {category_id}, search: '{search}', page: {page}, per_page: {per_page}")
        
        # Build query
        query = Product.query.filter_by(is_active=True)
        
        # Apply filters
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if search:
            query = query.filter(
                (Product.name.ilike(f'%{search}%')) | 
                (Product.description.ilike(f'%{search}%'))
            )
        
        # Get paginated results
        products = query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        print(f"📦 Found {products.total} total products, {len(products.items)} on this page")
        
        # Convert products to dict with error handling
        products_data = []
        for product in products.items:
            try:
                product_dict = product.to_dict()
                products_data.append(product_dict)
                print(f"✅ Successfully converted product {product.id}")
            except Exception as e:
                print(f"❌ Error converting product {product.id}: {str(e)}")
                # Create a basic product dict as fallback
                products_data.append({
                    'id': product.id,
                    'name': getattr(product, 'name', 'Unknown Product'),
                    'description': getattr(product, 'description', 'No description available'),
                    'price': float(product.price) if getattr(product, 'price', None) else None,
                    'image_urls': [],
                    'contact_info': getattr(product, 'contact_info', 'No contact info'),
                    'is_active': getattr(product, 'is_active', True),
                    'seller_username': 'Unknown',
                    'category_name': 'Uncategorized',
                    'error_in_conversion': str(e)
                })
        
        response_data = {
            'products': products_data,
            'total': products.total,
            'pages': products.pages,
            'current_page': page
        }
        
        print(f"✅ Successfully returning {len(products_data)} products")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"❌ Error in get_products: {str(e)}")
        import traceback
        print(f"❌ Stack trace: {traceback.format_exc()}")
        
        return jsonify({
            'message': 'Error fetching products',
            'error': str(e),
            'debug_info': 'Check server logs for details'
        }), 500

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product details"""
    try:
        product = Product.query.filter_by(id=product_id, is_active=True).first()
        
        if not product:
            return jsonify({'message': 'Product not found'}), 404
        
        return jsonify({
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching product', 'error': str(e)}), 500

@products_bp.route('/', methods=['POST'])
@token_required
def create_product(current_user):
    """Create a new product"""
    try:
        # Use force=True to parse JSON regardless of Content-Type
        data = request.get_json(force=True)
        
        print("📦 Creating product with data:", data)  # Debug log
        
        # Validate required fields
        required_fields = ['name', 'description', 'category_id', 'contact_info']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'message': 'Missing required fields: name, description, category_id, contact_info'
            }), 400
        
        # Check if category exists
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'message': 'Invalid category'}), 400
        
        # Handle image_urls - ensure it's always a list
        image_urls = data.get('image_urls', [])
        print("🖼️ Received image_urls:", image_urls)
        
        if isinstance(image_urls, str):
            # If it's a string, try to parse as JSON or split
            try:
                image_urls = json.loads(image_urls)
            except:
                # If not JSON, split by commas or handle as single URL
                if ',' in image_urls:
                    image_urls = [url.strip() for url in image_urls.split(',') if url.strip()]
                else:
                    image_urls = [image_urls] if image_urls.strip() else []
        
        # Ensure it's a list and filter empty values
        if not isinstance(image_urls, list):
            image_urls = []
        
        image_urls = [url for url in image_urls if url and url.strip()]
        print("🖼️ Processed image_urls:", image_urls)
        
        # Create new product
        new_product = Product(
            user_id=current_user.id,
            category_id=data['category_id'],
            name=data['name'].strip(),
            description=data['description'].strip(),
            price=data.get('price'),
            location=data['location'].strip(),  # ADD THIS LINE
            image_urls=image_urls,
            contact_info=data['contact_info'].strip()
        )
        
        db.session.add(new_product)
        db.session.commit()
        
        # Return the created product with proper data
        product_data = new_product.to_dict()
        print("✅ Product created successfully:", product_data)
        
        return jsonify({
            'message': 'Product created successfully',
            'product': product_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating product: {str(e)}")
        return jsonify({
            'message': 'Error creating product', 
            'error': str(e)
        }), 500


@products_bp.route('/upload-image', methods=['POST'])
@token_required
def upload_product_image(current_user):
    """Upload product image - PRODUCTION READY"""
    try:
        if 'image' not in request.files:
            return jsonify({'message': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'message': 'No image selected'}), 400
        
        if file and allowed_file(file.filename):
            # Use absolute path for production
            upload_folder = os.path.join(current_app.root_path, 'uploads', 'products')
            os.makedirs(upload_folder, exist_ok=True)
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(upload_folder, unique_filename)
            
            # Save file
            file.save(file_path)
            
            # Return the URL path for accessing the image
            image_url = f"/uploads/products/{unique_filename}"
            
            print(f"✅ Image uploaded successfully: {image_url}")
            print(f"📁 File saved at: {file_path}")
            
            return jsonify({
                'message': 'Image uploaded successfully',
                'image_url': image_url
            }), 200
        else:
            return jsonify({'message': 'Invalid file type. Allowed: png, jpg, jpeg, gif, webp'}), 400
            
    except Exception as e:
        print(f"❌ Error uploading image: {str(e)}")
        return jsonify({'message': 'Error uploading image', 'error': str(e)}), 500

# ... rest of your products.py routes remain the same

@products_bp.route('/<int:product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    """Update a product and clean up removed images"""
    try:
        product = Product.query.get_or_404(product_id)
        
        # Check if user owns the product
        if product.user_id != current_user.id and not current_user.is_admin:
            return jsonify({'message': 'Unauthorized to update this product'}), 403
        
        data = request.get_json()
        
        # Store old image URLs for cleanup
        old_image_urls = product.image_urls or []
        
        # Update fields
        if 'name' in data:
            product.name = data['name'].strip()
        if 'description' in data:
            product.description = data['description'].strip()
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if category:
                product.category_id = data['category_id']
        if 'price' in data:
            product.price = data['price']
        if 'location' in data:  # ADD THIS BLOCK
            product.location = data['location'].strip()
        if 'image_urls' in data:
            # Find images that were removed
            new_image_urls = data['image_urls'] or []
            removed_images = [url for url in old_image_urls if url not in new_image_urls]
            
            # Delete removed image files
            if removed_images:
                delete_product_images(removed_images)
            
            product.image_urls = new_image_urls
        if 'contact_info' in data:
            product.contact_info = data['contact_info'].strip()
        if 'is_active' in data and current_user.is_admin:
            product.is_active = data['is_active']
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating product', 'error': str(e)}), 500

@products_bp.route('/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    """Delete a product - HARD DELETE for users, cleans up images"""
    try:
        product = Product.query.get_or_404(product_id)
        
        # Check if user owns the product or is admin
        if product.user_id != current_user.id and not current_user.is_admin:
            return jsonify({'message': 'Unauthorized to delete this product'}), 403
        
        # Store image URLs for cleanup
        image_urls = product.image_urls or []
        
        # HARD DELETE - Remove from database
        db.session.delete(product)
        db.session.commit()
        
        # Delete physical image files
        deleted_files = []
        if image_urls:
            deleted_files = delete_product_images(image_urls)
        
        return jsonify({
            'message': 'Product deleted successfully',
            'deleted_images_count': len(deleted_files)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error deleting product', 'error': str(e)}), 500

# Improve the delete_product_images function
def delete_product_images(image_urls):
    """Delete physical image files from uploads folder - PRODUCTION READY"""
    try:
        deleted_files = []
        for image_url in image_urls:
            if image_url and isinstance(image_url, str):
                # Extract filename from URL
                filename = None
                
                if image_url.startswith('/uploads/products/'):
                    filename = image_url.split('/')[-1]
                elif image_url.startswith('http') and '/uploads/products/' in image_url:
                    filename = image_url.split('/uploads/products/')[-1].split('?')[0]
                else:
                    filename = image_url
                
                if filename:
                    # Use absolute path for production
                    file_path = os.path.join(current_app.root_path, 'uploads', 'products', filename)
                    
                    # Delete the file if it exists
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        deleted_files.append(filename)
                        print(f"✅ Deleted image file: {filename}")
                    else:
                        print(f"⚠️ Image file not found: {file_path}")
        
        print(f"🗑️ Cleaned up {len(deleted_files)} image files")
        return deleted_files
        
    except Exception as e:
        print(f"❌ Error deleting image files: {str(e)}")
        return []

@products_bp.route('/user/products', methods=['GET'])
@token_required
def get_user_products(current_user):
    """Get all products for the current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        products = Product.query.filter_by(user_id=current_user.id)\
            .order_by(Product.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'products': [product.to_dict() for product in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching user products', 'error': str(e)}), 500
@products_bp.route('/my-products', methods=['GET'])
@token_required
def get_my_products(current_user):
    """Get current user's products - alias for user/products"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        products = Product.query.filter_by(user_id=current_user.id)\
            .order_by(Product.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'products': [product.to_dict() for product in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching user products', 'error': str(e)}), 500    
    
@products_bp.route('/test', methods=['GET'])
def test_products():
    """Test endpoint to verify Product model works"""
    try:
        print("🧪 Testing Product model...")
        
        # Test if we can query products
        test_product = Product.query.first()
        
        if test_product:
            print(f"✅ Found test product: {test_product.name}")
            
            # Test to_dict method
            try:
                product_dict = test_product.to_dict()
                print("✅ to_dict() method works!")
                return jsonify({
                    'success': True,
                    'message': 'Product model is working correctly',
                    'test_product': product_dict
                }), 200
            except Exception as e:
                print(f"❌ to_dict() failed: {str(e)}")
                return jsonify({
                    'success': False,
                    'message': 'to_dict method failed',
                    'error': str(e),
                    'product_data': {
                        'id': test_product.id,
                        'name': test_product.name,
                        'has_to_dict': hasattr(test_product, 'to_dict')
                    }
                }), 500
        else:
            return jsonify({
                'success': False,
                'message': 'No products found in database'
            }), 404
            
    except Exception as e:
        print(f"❌ Test endpoint failed: {str(e)}")
        import traceback
        print(f"❌ Stack trace: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'message': 'Test endpoint failed',
            'error': str(e)
        }), 500    
