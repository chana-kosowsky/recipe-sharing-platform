"""
app.py - קובץ השרת הראשי
=======================
קובץ זה מכיל רק יצירת השרת וחיבור הנתיבים
"""

# טעינת משתני סביבה מקובץ .env לפני כל שאר הייבואים
# כך ש-config.py ושאר המודולים יוכלו לקרוא ל-os.environ.get(...) ולקבל את הערכים.
from dotenv import load_dotenv
load_dotenv()
# ========================================================
# הגדרת תעודות האבטחה של נטפרי - שימוש בקובץ המקומי של הפרויקט
# ========================================================
# ========================================================
# הגדרת תעודות האבטחה של נטפרי - פתרון מקיף וסופי
# ========================================================
import os
import shutil
import certifi

# מיקום קובץ ה-cacert.pem שערכת ונמצא בפרויקט שלך
base_dir = os.path.dirname(os.path.abspath(__file__))
local_cert_path = os.path.join(base_dir, 'cacert.pem')

# נתיב נקי מרווחים בתוך תיקייה ציבורית ב-Windows
clean_cert_path = r"C:\Users\Public\cacert_netfree.pem"

try:
    # העתקת הקובץ המתוקן שלך לתיקייה הציבורית
    shutil.copy(local_cert_path, clean_cert_path)
    final_cert = clean_cert_path
except Exception:
    final_cert = local_cert_path

# 1. חיווט משתני הסביבה עבור ספריות סטנדרטיות ו-gRPC
os.environ['SSL_CERT_FILE'] = final_cert
os.environ['REQUESTS_CA_BUNDLE'] = final_cert
os.environ['GRPC_DEFAULT_SSL_ROOTS_FILE_PATH'] = final_cert

# 2. דריסת פונקציית certifi.where - קריטי עבור ספריות גוגל שעוקפות את משתני הסביבה!
certifi.where = lambda: final_cert
# ========================================================
# ========================================================
from flask import Flask
from flask_cors import CORS
from models import db
from config import Config

# ייבוא ה-Blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.admin_routes import admin_bp
from routes.recipe_routes import recipe_bp
from routes.image_routes import image_bp
from routes.ai_routes import ai_bp


# ===================================
# יצירת אפליקציית Flask
# ===================================
def create_app():
    """
      יוצר ומגדיר את אפליקציית Flask.

    מה הפונקציה עושה?
    1. יוצרת אפליקציית Flask
    2. טוענת הגדרות מ-config.py
    3. מחברת את SQLAlchemy
    4. מגדירת CORS (כדי ש-Angular יוכל לדבר איתנו)
    5. רושמת את כל הנתיבים (Blueprints)
    6. יוצרת את הטבלאות במסד הנתונים
    """
    # יצירת האפליקציה
    app = Flask(__name__)
    # טעינת ההגדרות
    app.config.from_object(Config)
    Config.init_app(app)  # יוצר תיקיות (instance, uploads)

    # חיבור SQLAlchemy לאפליקציה
    db.init_app(app)

    # ===================================
    # CORS - הגדרת חוצה-מקורות עם תמיכה בעוגיות
    # ===================================

    CORS(
        app,
        supports_credentials=True,
        origins=['http://localhost:4200']
    )

    # ===================================
    # רישום Blueprints (הנתיבים!)
    # ===================================
    # כל ה-Blueprints נרשמים תחת /api - כך שכל הנתיבים שלהם מתחילים ב-/api/...
    # הסדר לא משנה לפלאסק, אבל סידרנו לפי תחום אחריות לקריאות.

    app.register_blueprint(auth_bp, url_prefix='/api')      # התחברות, רישום, /me, /logout
    app.register_blueprint(user_bp, url_prefix='/api')      # פרופיל משתמש, בקשות העלאה
    app.register_blueprint(admin_bp, url_prefix='/api')     # פעולות מנהל
    app.register_blueprint(recipe_bp, url_prefix='/api')    # מתכונים ודירוגים
    app.register_blueprint(image_bp, url_prefix='/api')     # הגשת תמונות
    app.register_blueprint(ai_bp, url_prefix='/api')        # שף AI - צ'אט והתאמת מתכונים

    print("✅ Blueprints נרשמו בהצלחה!")
    print("   🔐 Auth:   /api/login, /api/logout, /api/me, /api/users")
    print("   👤 User:   /api/user/<id>, /api/user/request-upload-permission")
    print("   👑 Admin:  /api/admin/pending-users, /api/admin/approve-user, ...")
    print("   📗 Recipe: /api/recipes, /api/recipes/<id>, /api/recipes/<id>/rate")
    print("   🖼️  Image:  /api/images/<user_id>/<filename>, /api/uploads/...")
    print("   🤖 AI:     /api/ai/chat, /api/ai/adapt")
    # ===================================
    # יצירת הטבלאות במסד הנתונים
    # ===================================
    with app.app_context():
        db.create_all()
        print("✅ מסד הנתונים מוכן!")
        print(f"📂 מיקום DB: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print(f"📁 תיקיית תמונות: {app.config['UPLOAD_FOLDER']}")

    return app


# ===================================
# נקודת הכניסה - הרצת השרת
# ===================================
if __name__ == '__main__':
    # יצירת האפליקציה
    app = create_app()
    app.run(debug=True, port=5000)
