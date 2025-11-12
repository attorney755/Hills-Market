from flask import Blueprint, request, jsonify
from app import db
from app.models.category import Category
from app.utils.auth import token_required, admin_required

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['GET'])
def get_categories():
    """Get all categories"""
    try:
        categories = Category.query.order_by(Category.name).all()
        
        return jsonify({
            'categories': [category.to_dict() for category in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching categories', 'error': str(e)}), 500

@categories_bp.route('/', methods=['POST'])
@token_required
@admin_required
def create_category(current_user):
    """Create a new category (admin only)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'message': 'Category name is required'}), 400
        
        # Check if category already exists
        existing_category = Category.query.filter_by(name=data['name']).first()
        if existing_category:
            return jsonify({'message': 'Category already exists'}), 400
        
        new_category = Category(
            name=data['name'].strip(),
            description=data.get('description', '')
        )
        
        db.session.add(new_category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': new_category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error creating category', 'error': str(e)}), 500