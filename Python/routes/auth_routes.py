"""
routes/auth_routes.py - נתיבי אימות והתחברות
==============================================
כל מה שקשור להתחברות, התנתקות, רישום, וקבלת פרטי המשתמש המחובר.
הטוקן (JWT) נשמר בעוגייה (cookie) חתומה ולא ב-localStorage - זה הרבה יותר בטוח
כי JavaScript ב-frontend לא יכול לקרוא עוגיות עם דגל HttpOnly.
"""

from flask import Blueprint, request, jsonify, make_response, current_app
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from utils.auth import generate_token, token_required
import re

# Blueprint נפרד לכל ענייני האימות
auth_bp = Blueprint('auth_bp', __name__)


# ===================================
# פונקציות עזר לוולידציה
# ===================================

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    if len(password) < 6:
        return False, 'הסיסמה חייבת להכיל לפחות 6 תווים'
    return True, ''


# ===================================
# פונקציית עזר - הוספת עוגיית הטוקן לתגובה
# ===================================
# מקבלת אובייקט תגובה ומחרוזת טוקן, ומחזירה את התגובה אחרי הוספת העוגייה.
# httponly=True - חוסם גישה מ-JavaScript בדפדפן (הגנה מפני XSS).
# samesite='Lax' - הדפדפן ישלח את העוגייה רק אם הבקשה מגיעה מאותו אתר או מקישור רגיל.
# secure=False - בפיתוח אנחנו על http. בפרודקשן יש להחליף ל-True (https בלבד).
# max_age - אורך החיים של העוגייה בשניות, תואם את תוקף הטוקן עצמו.
def _set_auth_cookie(response, token):
    response.set_cookie(
        current_app.config['AUTH_COOKIE_NAME'],
        token,
        httponly=True,
        samesite='Lax',
        secure=False,
        max_age=int(current_app.config['JWT_EXPIRATION_DAYS'].total_seconds())
    )
    return response


# ===================================
# רישום משתמש חדש
# ===================================

@auth_bp.route('/users', methods=['POST'])
def create_user():
    """
    יצירת משתמש חדש (רישום).
    Body: username, email, password
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'לא נשלחו נתונים'}), 400

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'error': 'חסרים שדות חובה (username, email, password)'}), 400

        username = username.strip()
        email = email.strip()

        if len(username) < 3:
            return jsonify({'error': 'שם המשתמש חייב להכיל לפחות 3 תווים'}), 400

        if len(username) > 80:
            return jsonify({'error': 'שם המשתמש חייב להכיל עד 80 תווים'}), 400

        if not validate_email(email):
            return jsonify({'error': 'כתובת האימייל אינה תקינה'}), 400

        is_valid, error_message = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_message}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'שם המשתמש כבר קיים במערכת'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'כתובת האימייל כבר רשומה במערכת'}), 400

        # ⚠️ הסיסמה נשמרת מוצפנת תמיד - אף פעם לא בפשוטה!
        hashed_password = generate_password_hash(password)

        new_user = User(
            username=username,
            email=email,
            password=hashed_password,
            role='Reader',
            is_approved_uploader=False
        )

        if not new_user.save():
            return jsonify({'error': 'שגיאה בשמירת המשתמש'}), 500

        return jsonify({
            'message': 'המשתמש נוצר בהצלחה',
            'user': new_user.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'error': f'שגיאה ביצירת משתמש: {str(e)}'}), 500


# ===================================
# 🔐 התחברות - מנפיק JWT ושומר בעוגייה
# ===================================
# מאמת את פרטי ההתחברות, מנפיק טוקן JWT חתום, ומחזיר אותו כעוגייה HttpOnly.
# הפרונט-אנד לא צריך לטפל בטוקן בכלל - הדפדפן ינהל את העוגייה אוטומטית
# וישלח אותה עם כל בקשה הבאה (כל עוד withCredentials=true בצד הלקוח).

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'לא נשלחו נתונים'}), 400

        login_identifier = data.get('username') or data.get('email')
        password = data.get('password')

        if not login_identifier or not password:
            return jsonify({'error': 'חסרים שדות חובה (username/email וסיסמה)'}), 400

        login_identifier = login_identifier.strip()

        user = User.query.filter(
            (User.username == login_identifier) | (User.email == login_identifier)
        ).first()

        # אותה הודעת שגיאה לשני המקרים (משתמש לא קיים / סיסמה שגויה) -
        # כדי לא לחשוף לתוקף האם משתמש מסוים קיים במערכת.
        if not user or not check_password_hash(user.password, password):
            return jsonify({'error': 'שם משתמש או סיסמה שגויים'}), 401

        # יצירת JWT והחזרתו כעוגייה
        token = generate_token(user)
        response = make_response(jsonify({
            'message': 'התחברות בוצעה בהצלחה!',
            'user': user.to_dict()
        }), 200)
        return _set_auth_cookie(response, token)

    except Exception as e:
        return jsonify({'error': f'שגיאה בהתחברות: {str(e)}'}), 500


# ===================================
# 🚪 התנתקות - ניקוי העוגייה
# ===================================
# מוחק את העוגייה בצד הלקוח ע"י החזרת אותה עוגייה עם תוקף 0.
# אין צורך באימות טוקן כדי להתנתק - גם אם הטוקן פג תוקף, רוצים שהמשתמש
# יוכל "להתנתק" וייפטר משאריות העוגייה.

@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({'message': 'התנתקת בהצלחה'}), 200)
    response.set_cookie(
        current_app.config['AUTH_COOKIE_NAME'],
        '',
        httponly=True,
        samesite='Lax',
        secure=False,
        max_age=0
    )
    return response


# ===================================
# 👤 מי המשתמש המחובר?
# ===================================
# הפרונט-אנד קורא לכאן בעת טעינת האפליקציה כדי לדעת אם יש משתמש מחובר.
# אם העוגייה תקינה - מקבלים את פרטי המשתמש. אם לא - 401 והפרונט-אנד יבין
# שצריך לשלוח את המשתמש למסך התחברות.

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'user': current_user.to_dict()}), 200
