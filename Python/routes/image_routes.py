"""
routes/image_routes.py - הגשת קבצי תמונות
==========================================
הקובץ הזה אחראי על שליחת קבצי תמונות מהדיסק לדפדפן.
הוצאנו את הנתיבים האלה מ-recipe_routes.py כי הגשת תמונות זה עניין נפרד
ממתכונים - כך הקוד מסודר ויותר קל למצוא.
"""

import os
from flask import Blueprint, jsonify, send_from_directory, current_app

# Blueprint ייעודי להגשת תמונות
image_bp = Blueprint('image_bp', __name__)


# ===================================
# הגשת תמונת מתכון מתיקיית המשתמש
# ===================================
# הדפדפן פונה לכאן עם ה-URL שמופיע בתגית <img>. אנחנו בונים את הנתיב
# המלא לקובץ ושולחים אותו דרך send_from_directory (פונקציה של Flask
# שמטפלת בכותרות, MIME types וכו').

@image_bp.route('/images/<int:user_id>/<filename>')
def serve_image(user_id, filename):
    try:
        user_folder = f'user_{user_id}'
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], user_folder, filename)

        if not os.path.exists(file_path):
            return jsonify({'error': 'תמונה לא נמצאה'}), 404

        return send_from_directory(
            os.path.join(current_app.config['UPLOAD_FOLDER'], user_folder),
            filename
        )
    except FileNotFoundError:
        return jsonify({'error': 'תמונה לא נמצאה'}), 404


# ===================================
# הגשת קבצים כלליים מתיקיית uploads
# ===================================
# נתיב גמיש יותר עבור כל קובץ שנמצא תחת תיקיית ה-uploads.
# שימושי כשהפרונט-אנד מקבל path מלא (כולל תת-תיקיות) ורוצה למשוך אותו ישירות.

@image_bp.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
