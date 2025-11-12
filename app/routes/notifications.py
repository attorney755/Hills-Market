from flask import Blueprint, request, jsonify
from app import db
from app.models.notification import Notification
from app.models.user import User
from app.utils.auth import token_required, admin_required
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@token_required
def get_user_notifications(current_user):
    """Get notifications for current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Build query
        query = Notification.query.filter_by(user_id=current_user.id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications.items],
            'total': notifications.total,
            'unread_count': Notification.query.filter_by(user_id=current_user.id, is_read=False).count(),
            'pages': notifications.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching notifications', 'error': str(e)}), 500

@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(current_user, notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=current_user.id
        ).first()
        
        if not notification:
            return jsonify({'message': 'Notification not found'}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating notification', 'error': str(e)}), 500

@notifications_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_as_read(current_user):
    """Mark all notifications as read"""
    try:
        Notification.query.filter_by(user_id=current_user.id, is_read=False).update(
            {'is_read': True}
        )
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating notifications', 'error': str(e)}), 500

@notifications_bp.route('/broadcast', methods=['POST'])
@token_required
@admin_required
def broadcast_notification(current_user):
    """Send notification to all users (admin only)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('message'):
            return jsonify({'message': 'Notification message is required'}), 400
        
        # Get all active users
        users = User.query.filter_by(is_active=True).all()
        
        # Create notifications for each user
        for user in users:
            notification = Notification(
                user_id=user.id,
                message=data['message'],
                is_admin_notification=True
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Notification sent to {len(users)} users',
            'users_notified': len(users)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error sending notification', 'error': str(e)}), 500

def create_notification(user_id, message, is_admin_notification=False):
    """Helper function to create notifications"""
    try:
        notification = Notification(
            user_id=user_id,
            message=message,
            is_admin_notification=is_admin_notification
        )
        db.session.add(notification)
        db.session.commit()
        return True
    except:
        db.session.rollback()
        return False