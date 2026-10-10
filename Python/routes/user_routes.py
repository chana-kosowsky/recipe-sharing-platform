"""
routes/user_routes.py - נתיבי משתמשים
======================================
הקובץ הזה מטפל בכל מה שקשור לפרטי משתמש (פרופיל, מתכונים שלו, בקשות).
"""

from flask import Blueprint, jsonify
from models import db, User, Recipe
from utils.auth import token_required

user_bp = Blueprint('user_bp', __name__)


# ===================================
# בדיקת בריאות השרת
# ===================================
# נתיב פשוט שמאפשר לוודא שהשרת חי. שימושי לפיתוח ובדיקות.

@user_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'השרת עובד תקין'}), 200


# ===================================
# פרופיל משתמש (פתוח לכולם)
# ===================================
# מחזיר פרטי משתמש + ספירת מתכונים. נתיב ציבורי - גם משתמש לא מחובר
# יכול לראות פרופיל של אחרים (כמו הצגת "הכותב של המתכון").

@user_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        recipe_count = Recipe.query.filter_by(user_id=user_id).count()

        return jsonify({
            'user': user.to_dict(),
            'recipe_count': recipe_count
        }), 200

    except Exception as e:
        return jsonify({'error': f'שגיאה: {str(e)}'}), 500


# ===================================
# רשימת מתכונים של משתמש (פתוח לכולם)
# ===================================

@user_bp.route('/user/<int:user_id>/recipes', methods=['GET'])
def get_user_recipes(user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'משתמש לא נמצא'}), 404

        user_recipes = (Recipe.query.filter_by(user_id=user_id)
                        .order_by(Recipe.created_at.desc()).all())

        recipes_list = [recipe.to_dict() for recipe in user_recipes]

        return jsonify({
            'recipes': recipes_list,
            'count': len(recipes_list),
            'username': user.username
        }), 200

    except Exception as e:
        return jsonify({'error': f'שגיאה: {str(e)}'}), 500


# ===================================
# בקשה להיות Uploader (חייב להיות מחובר)
# ===================================
# קודם המשתמש שלח user_id בגוף הבקשה - לא בטוח, כי כל אחד היה יכול לשלוח
# id של משתמש אחר. עכשיו הזהות נקבעת מהטוקן בעוגייה דרך @token_required.

@user_bp.route('/user/request-upload-permission', methods=['POST'])
@token_required
def request_upload_permission(current_user):
    try:
        if current_user.is_approved_uploader:
            return jsonify({'error': 'אתה כבר Uploader מאושר!'}), 400

        if current_user.upload_request_status == 'pending':
            return jsonify({'error': 'הבקשה שלך כבר נשלחה ומחכה לאישור'}), 400

        current_user.upload_request_status = 'pending'
        db.session.commit()

        return jsonify({
            'message': 'הבקשה נשלחה בהצלחה! נודיע לך כשתאושר.',
            'status': 'pending'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'שגיאה: {str(e)}'}), 500
