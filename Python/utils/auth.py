"""
utils/auth.py - אימות משתמשים באמצעות JWT
==========================================
הקובץ הזה מרכז את כל הלוגיקה של טוקנים: יצירה, פענוח, ועיטורים (decorators)
שמגנים על נתיבים. במקום לשלוח admin_user_id בגוף הבקשה (לא בטוח!) - הקוד הזה
קורא את הטוקן מתוך עוגייה (cookie) ומאמת מי המשתמש.
"""

from datetime import datetime, timezone
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from models import User


# ===================================
# יצירת טוקן (אחרי התחברות מוצלחת)
# ===================================
# מקבלת אובייקט User ומחזירה מחרוזת טוקן חתומה.
# הטוקן מכיל user_id, role ותאריך תפוגה (exp).
# החתימה נעשית עם SECRET_KEY מתוך config - לכן רק השרת שלנו יכול ליצור טוקן תקף.
def generate_token(user):
    payload = {
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_EXPIRATION_DAYS']
    }
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm=current_app.config['JWT_ALGORITHM']
    )
    return token


# ===================================
# פענוח ואימות טוקן
# ===================================
# מקבלת מחרוזת טוקן ומנסה לפענח אותה. אם הטוקן תקין מחזירה את ה-payload (מילון).
# אם הטוקן פג תוקף, מזויף, או פגום - מחזירה None.
# הפונקציה תופסת את החריגות בעצמה כדי שהקוד הקורא יישאר נקי.
def decode_token(token):
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=[current_app.config['JWT_ALGORITHM']]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ===================================
# Decorator @token_required - חובת התחברות
# ===================================
# עוטף נתיב ומבטיח שלמשתמש יש טוקן תקף לפני שהקוד של הנתיב רץ.
# שולף את הטוקן מהעוגייה, מפענח, מוצא את המשתמש בבסיס הנתונים,
# ומעביר את אובייקט ה-User לפונקציה דרך הפרמטר current_user.
# אם משהו לא בסדר - מחזיר 401 ולא מריץ את הנתיב בכלל.
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        cookie_name = current_app.config['AUTH_COOKIE_NAME']
        token = request.cookies.get(cookie_name)

        if not token:
            return jsonify({'error': 'נדרשת התחברות'}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'טוקן לא תקף או פג תוקף'}), 401

        current_user = User.query.get(payload['user_id'])
        if not current_user:
            return jsonify({'error': 'המשתמש לא קיים'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# ===================================
# Decorator @admin_required - חובת הרשאת מנהל
# ===================================
# מבוסס על token_required ובנוסף בודק שהמשתמש הוא Admin.
# מחליף את הקוד הישן שסמך על admin_user_id מגוף הבקשה (לא בטוח!) -
# כאן הזהות נקבעת מהטוקן החתום בעוגייה ולא ממשהו ששלח הלקוח.
def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'Admin':
            return jsonify({'error': '⛔ אין לך הרשאה לבצע פעולה זו'}), 403
        return f(current_user, *args, **kwargs)
    return decorated
