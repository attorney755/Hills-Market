from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.notification import Notification
from app.routes.products import delete_product_images
from app.utils.auth import token_required, admin_required
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)
# Add this to your admin.py after the imports
@admin_bp.route('/dashboard', methods=['GET'])
@token_required
@admin_required
def get_dashboard(current_user):
    """Simple dashboard endpoint that matches frontend expectation"""
    try:
        # Basic counts
        total_users = User.query.count()
        total_products = Product.query.count()
        active_products = Product.query.filter_by(is_active=True).count()
        total_categories = Category.query.count()
        
        return jsonify({
            'stats': {
                'total_users': total_users,
                'total_products': total_products,
                'active_products': active_products,
                'total_categories': total_categories,
                'new_users_week': 0,  # You can calculate these later
                'new_products_week': 0,
                'users_with_products': 0,
                'active_users_percentage': 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching dashboard', 'error': str(e)}), 500

@admin_bp.route('/dashboard/stats', methods=['GET'])
@token_required
@admin_required
def get_dashboard_stats(current_user):
    """Get admin dashboard statistics"""
    try:
        # Basic counts
        total_users = User.query.count()
        total_products = Product.query.count()
        active_products = Product.query.filter_by(is_active=True).count()
        total_categories = Category.query.count()
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users_week = User.query.filter(User.created_at >= week_ago).count()
        new_products_week = Product.query.filter(Product.created_at >= week_ago).count()
        
        # User activity stats
        users_with_products = db.session.query(Product.user_id).distinct().count()
        
        return jsonify({
            'stats': {
                'total_users': total_users,
                'total_products': total_products,
                'active_products': active_products,
                'total_categories': total_categories,
                'new_users_week': new_users_week,
                'new_products_week': new_products_week,
                'users_with_products': users_with_products,
                'active_users_percentage': round((users_with_products / total_users * 100) if total_users > 0 else 0, 1)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching dashboard stats', 'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_all_users(current_user):
    """Get all users with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = User.query
        
        if search:
            query = query.filter(
                (User.username.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            )
        
        users = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict(include_id=True) for user in users.items],  # Include ID for admin
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching users', 'error': str(e)}), 500
    
@admin_bp.route('/categories', methods=['GET'])
@token_required
@admin_required
def get_all_categories(current_user):
    """Get all categories for admin"""
    try:
        categories = Category.query.order_by(Category.name).all()
        
        # Get product count for each category
        categories_data = []
        for category in categories:
            category_dict = category.to_dict()
            category_dict['product_count'] = Product.query.filter_by(category_id=category.id).count()
            categories_data.append(category_dict)
        
        return jsonify({
            'categories': categories_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching categories', 'error': str(e)}), 500    

@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@token_required
@admin_required
def toggle_user_active(current_user, user_id):
    """Activate/deactivate user account"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent deactivating yourself
        if user.id == current_user.id:
            return jsonify({'message': 'Cannot deactivate your own account'}), 400
        
        user.is_active = not user.is_active
        db.session.commit()
        
        action = 'activated' if user.is_active else 'deactivated'
        return jsonify({
            'message': f'User {action} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating user', 'error': str(e)}), 500

@admin_bp.route('/products', methods=['GET'])
@token_required
@admin_required
def get_all_products(current_user):
    """Get all products with admin controls"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', 'all')  # all, active, inactive
        
        query = Product.query
        
        if status == 'active':
            query = query.filter_by(is_active=True)
        elif status == 'inactive':
            query = query.filter_by(is_active=False)
        
        products = query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'products': [product.to_dict() for product in products.items],
            'total': products.total,
            'pages': products.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching products', 'error': str(e)}), 500

@admin_bp.route('/products/<int:product_id>/toggle-active', methods=['PUT'])
@token_required
@admin_required
def toggle_product_active(current_user, product_id):
    """Activate/deactivate product"""
    try:
        product = Product.query.get_or_404(product_id)
        product.is_active = not product.is_active
        db.session.commit()
        
        action = 'activated' if product.is_active else 'deactivated'
        return jsonify({
            'message': f'Product {action} successfully',
            'product': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating product', 'error': str(e)}), 500

@admin_bp.route('/categories', methods=['POST'])
@token_required
@admin_required
def create_category(current_user):
    """Create new category"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'message': 'Category name is required'}), 400
        
        # Check if category exists
        existing = Category.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'message': 'Category already exists'}), 400
        
        category = Category(
            name=data['name'].strip(),
            description=data.get('description', '')
        )
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error creating category', 'error': str(e)}), 500

@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_category(current_user, category_id):
    """Delete category (if no products are using it)"""
    try:
        category = Category.query.get_or_404(category_id)
        
        # Check if category has products
        product_count = Product.query.filter_by(category_id=category_id).count()
        if product_count > 0:
            return jsonify({
                'message': f'Cannot delete category with {product_count} products. Move products first.'
            }), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error deleting category', 'error': str(e)}), 500

    finally:
        db.session.close()

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_product_admin(current_user, product_id):
    """Admin delete product (hard delete) and clean up images"""
    try:
        product = Product.query.get_or_404(product_id)
        
        # Store product info and image URLs for response and cleanup
        product_info = {
            'id': product.id,
            'name': product.name,
            'seller_id': product.user_id
        }
        image_urls = product.image_urls or []
        
        # Delete the product from database
        db.session.delete(product)
        db.session.commit()
        
        # Delete physical image files
        deleted_files = []
        if image_urls:
            deleted_files = delete_product_images(image_urls)
        
        return jsonify({
            'message': 'Product permanently deleted',
            'deleted_product': product_info,
            'deleted_images_count': len(deleted_files)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error deleting product', 'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Admin delete user account and clean up their product images"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent deleting yourself
        if user.id == current_user.id:
            return jsonify({'message': 'Cannot delete your own account'}), 400
        
        # Store user info for response
        user_info = {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
        
        # Get all user's products to clean up images
        user_products = Product.query.filter_by(user_id=user_id).all()
        all_image_urls = []
        
        for product in user_products:
            if product.image_urls:
                all_image_urls.extend(product.image_urls)
        
        # Delete user's notifications first
        Notification.query.filter_by(user_id=user_id).delete()
        
        # Delete user's products
        Product.query.filter_by(user_id=user_id).delete()
        
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        
        # Delete physical image files
        deleted_files = []
        if all_image_urls:
            deleted_files = delete_product_images(all_image_urls)
        
        return jsonify({
            'message': 'User and their data deleted successfully',
            'deleted_user': user_info,
            'deleted_products_count': len(user_products),
            'deleted_images_count': len(deleted_files)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting user {user_id}: {str(e)}")
        return jsonify({'message': 'Error deleting user', 'error': str(e)}), 500     