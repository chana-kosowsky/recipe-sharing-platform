"""
routes/admin_routes.py - נתיבים למנהל מערכת בלבד
==================================================
כל הנתיבים בקובץ הזה דורשים שהמשתמש יהיה Admin. במקום לסמוך על שדה
admin_user_id שמגיע בגוף הבקשה (לא בטוח - כל אחד יכול לשלוח כל ID),
אנחנו משתמשים ב-decorator @admin_required שמאמת את הזהות מהעוגייה החתומה.
"""

from flask import Blueprint, jsonify
from models import db, User
from utils.auth import admin_required

# Blueprint נפרד לכל ענייני הניהול
admin_bp = Blueprint('admin_bp', __name__)


# ===================================
# רשימת משתמשים שממתינים לאישור Uploader
# ===================================

@admin_bp.route('/admin/pending-users', methods=['GET'])
@admin_required
def get_pending_users(current_user):
    try:
        pending_users = User.query.filter_by(upload_request_status='pending').all()
        users_list = [user.to_dict() for user in pending_users]

        return jsonify({
            'users': users_list,
            'count': len(users_list)
        }), 200

    except Exception as e:
        return jsonify({'error': f'שגיאה בשליפת משתמשים: {str(e)}'}), 500


# ===================================
# אישור משתמש כ-Uploader
# ===================================
@admin_bp.route('/admin/approve-user/<int:user_id>', methods=['POST'])
@admin_required
def approve_user(current_user, user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        user.is_approved_uploader = True
        user.role = 'Uploader'
        user.upload_request_status = 'approved'

        db.session.commit()

        return jsonify({
            'message': f'המשתמש {user.username} אושר בהצלחה!',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'שגיאה באישור משתמש: {str(e)}'}), 500


# ===================================
# דחיית בקשת Uploader
# ===================================

@admin_bp.route('/admin/reject-user/<int:user_id>', methods=['POST'])
@admin_required
def reject_user(current_user, user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        user.upload_request_status = 'rejected'
        user.is_approved_uploader = False
        db.session.commit()

        return jsonify({
            'message': f'הבקשה של {user.username} נדחתה'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'שגיאה בדחיית בקשה: {str(e)}'}), 500
