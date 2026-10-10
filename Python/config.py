import os
# datetime - נצטרך אותו כדי להגדיר תוקף לטוקן (בכמה ימים הוא יפוג)
from datetime import timedelta

class Config:
    """הגדרות כלליות לאפליקציה"""

    # נתיבים
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))


    # מסד נתונים
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "instance", "recipes.db")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


    # ===================================
    # 🔐 הגדרות אבטחה - JWT (JSON Web Token)
    # כאן אנחנו נופלים לערך ברירת מחדל לפיתוח בלבד.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-me-in-production-12345'

    # JWT_ALGORITHM - האלגוריתם שאיתו חותמים את הטוקן.
    # HS256 = HMAC עם SHA-256, אלגוריתם סימטרי (אותו מפתח חותם ומאמת).
    JWT_ALGORITHM = 'HS256'

    # JWT_EXPIRATION_DAYS - לכמה ימים הטוקן תקף לפני שהמשתמש צריך להתחבר שוב.
    JWT_EXPIRATION_DAYS = timedelta(days=7)

    # AUTH_COOKIE_NAME - שם העוגייה שבה ה-JWT יישמר בדפדפן של המשתמש.
    # זה השם שגם הבק-אנד מחפש (כשבא לאמת בקשה) וגם הפרונט-אנד שולח בקשות עם.
    AUTH_COOKIE_NAME = 'auth_token'


    # תמונות - הגדרות
    # תיקייה לשמירת תמונות
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

    # גודל קובץ מקסימלי (5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024

    @staticmethod
    def init_app(app):
        """
        אתחול נוסף של האפליקציה.
        נקרא פעם אחת בעת יצירת האפליקציה.
        """
        #  צור את תיקיית instance (למסד נתונים)
        instance_folder = os.path.join(Config.BASE_DIR, 'instance')
        os.makedirs(instance_folder, exist_ok=True)  # ← חסר!
        print(f"✅ תיקיית instance נוצרה: {instance_folder}")

        # ⭐ צור את תיקיית uploads
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        print(f"✅ תיקיית uploads נוצרה: {Config.UPLOAD_FOLDER}")
        print(f"💡 תיקיות משתמשים (user_X) ייווצרו אוטומטית בהעלאת תמונה ראשונה")

