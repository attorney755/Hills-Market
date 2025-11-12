from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from datetime import datetime
from flask_mail import Mail


contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/send-message', methods=['POST'])
def send_contact_message():
    """Send contact form message to admin email"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'message': 'Missing required fields: name, email, subject, message'
            }), 400
        
        name = data['name']
        email = data['email']
        subject = data['subject']
        message_content = data['message']
        
        # Debug: Print current configuration
        print("🔧 Email Configuration:")
        print(f"  MAIL_SERVER: {current_app.config.get('MAIL_SERVER')}")
        print(f"  MAIL_USERNAME: {current_app.config.get('MAIL_USERNAME')}")
        print(f"  MAIL_DEFAULT_SENDER: {current_app.config.get('MAIL_DEFAULT_SENDER')}")
        print(f"  MAIL_PASSWORD_SET: {bool(current_app.config.get('MAIL_PASSWORD'))}")
        
        # Create email message with fallback sender
        sender = current_app.config.get('MAIL_DEFAULT_SENDER') or 'hillsmarket.official@gmail.com'
        
        msg = Message(
            subject=f"Marketplace Contact: {subject}",
            sender=sender,
            recipients=['hillsmarket.official@gmail.com'],
            reply_to=email
        )
        
        # Email body
        msg.body = f"""
New Contact Form Message from Marketplace

Name: {name}
Email: {email}
Subject: {subject}

Message:
{message_content}

---
Sent from Marketplace Contact Form
Timestamp: {datetime.utcnow()}
"""
        
        # Send email
        from flask_mail import Mail
        mail = Mail(current_app)
        mail.send(msg)
        
        print(f"✅ Contact email sent from {name} ({email})")
        
        return jsonify({
            'message': 'Thank you! Your message has been sent successfully.'
        }), 200
        
    except Exception as e:
        print(f"❌ Error sending contact email: {str(e)}")
        import traceback
        print(f"❌ Stack trace: {traceback.format_exc()}")
        
        return jsonify({
            'message': 'Sorry, there was an error sending your message. Please try again later.',
            'error': str(e)
        }), 500

@contact_bp.route('/test-email', methods=['GET'])
def test_email():
    """Test endpoint to verify email configuration"""
    try:
        from flask_mail import Message
        
        # Debug: Print current configuration
        print("🧪 Testing email configuration...")
        print(f"  MAIL_SERVER: {current_app.config.get('MAIL_SERVER')}")
        print(f"  MAIL_USERNAME: {current_app.config.get('MAIL_USERNAME')}")
        print(f"  MAIL_DEFAULT_SENDER: {current_app.config.get('MAIL_DEFAULT_SENDER')}")
        print(f"  MAIL_PASSWORD_SET: {bool(current_app.config.get('MAIL_PASSWORD'))}")
        
        # Use fallback sender if config is missing
        sender = current_app.config.get('MAIL_DEFAULT_SENDER') or 'hillsmarket.official@gmail.com'
        
        msg = Message(
            subject="Test Email from Marketplace",
            sender=sender,
            recipients=['hillsmarket.official@gmail.com']
        )
        
        msg.body = f"""
This is a test email from your Marketplace application.

If you're receiving this, your email configuration is working correctly!

Timestamp: {datetime.utcnow()}

Configuration:
- Server: {current_app.config.get('MAIL_SERVER')}
- Username: {current_app.config.get('MAIL_USERNAME')}
"""
        
        mail = Mail(current_app)
        mail.send(msg)
        
        print("✅ Test email sent successfully!")
        
        return jsonify({
            'success': True,
            'message': 'Test email sent successfully to hillsmarket.official@gmail.com'
        }), 200
        
    except Exception as e:
        print(f"❌ Failed to send test email: {str(e)}")
        import traceback
        print(f"❌ Stack trace: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'message': 'Failed to send test email',
            'error': str(e),
            'config_debug': {
                'MAIL_SERVER': current_app.config.get('MAIL_SERVER'),
                'MAIL_USERNAME': current_app.config.get('MAIL_USERNAME'),
                'MAIL_DEFAULT_SENDER': current_app.config.get('MAIL_DEFAULT_SENDER'),
                'MAIL_PASSWORD_SET': bool(current_app.config.get('MAIL_PASSWORD'))
            }
        }), 500

@contact_bp.route('/debug-email-config', methods=['GET'])
def debug_email_config():
    """Debug endpoint to check email configuration"""
    config = {
        'MAIL_SERVER': current_app.config.get('MAIL_SERVER'),
        'MAIL_PORT': current_app.config.get('MAIL_PORT'),
        'MAIL_USE_TLS': current_app.config.get('MAIL_USE_TLS'),
        'MAIL_USE_SSL': current_app.config.get('MAIL_USE_SSL'),
        'MAIL_USERNAME': current_app.config.get('MAIL_USERNAME'),
        'MAIL_PASSWORD_SET': bool(current_app.config.get('MAIL_PASSWORD')),
        'MAIL_DEFAULT_SENDER': current_app.config.get('MAIL_DEFAULT_SENDER'),
        'MAIL_DEBUG': current_app.config.get('MAIL_DEBUG')
    }
    
    return jsonify(config), 200