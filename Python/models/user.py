
from datetime import datetime
from .base import db, BaseModel
# ===================================
# User - טבלת משתמשים
# ===================================
class User(BaseModel):
    """
    מחלקה לניהול משתמשים באתר.

    יורשת מ-BaseModel ולכן כבר יש לה:
    - id
    - save()
    - delete()
    """

    # שם הטבלה בפועל במסד הנתונים
    __tablename__ = 'users'

    # ===== עמודות (Columns) =====

    # שם משתמש - מחרוזת עד 80 תווים
    # unique=True = לא יכולים להיות 2 משתמשים עם אותו שם
    # nullable=False = חובה למלא (לא יכול להיות ריק)
    username = db.Column(db.String(80), unique=True, nullable=False)

    # אימייל - מחרוזת עד 120 תווים
    email = db.Column(db.String(120), unique=True, nullable=False)

    # סיסמה - מחרוזת עד 200 תווים (כי נצפין אותה ואז היא תהיה ארוכה יותר)
    password = db.Column(db.String(200), nullable=False)

    # תפקיד: 'Admin', 'Uploader', או 'Reader'
    # default='Reader' = אם לא מציינים, זה יהיה Reader
    role = db.Column(db.String(20), default='Reader', nullable=False)

    # האם אושר להעלות מתכונים?
    # Boolean = True/False
    is_approved_uploader = db.Column(db.Boolean, default=False)
    #האם הגיש בקשה ליכולת העלאת מתכונים
    upload_request_status = db.Column(db.String(20), default='none')

    # תאריך הצטרפות
    # DateTime = תאריך + שעה
    # default=datetime.utcnow = אוטומטית שומר את הזמן הנוכחי
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ===== קשר למתכונים (Relationship) =====
    # זה לא עמודה אמיתית ב-DB! זה רק קישור נוח בפייתון.
    # כדי לחבר בין הטבלאות של המשתמשים וממתכונים
    # מה זה עושה?
    # אפשר לכתוב: user.recipes ולקבל את כל המתכונים של המשתמש
    #
    # backref='author' - מאפשר גם הפוך: recipe.author
    # lazy=True - לא טוען את המתכונים אלא אם מבקשים אותם (יותר יעיל)
    # cascade='all, delete-orphan' - אם מוחקים משתמש, מוחקים גם את המתכונים שלו
    recipes = db.relationship('Recipe', backref='author', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """
        ממיר את האובייקט למילון.
        למה? כדי להחזיר JSON ל-Angular בקלות.

        דוגמה:
        ------
        user = User.query.get(1)
        return jsonify(user.to_dict())  # Angular מקבל JSON יפה
        """
        # טיפול ב-created_at
        created_at_str = None
        if self.created_at:
            if isinstance(self.created_at, datetime):
                # אם זה datetime object - המר ל-ISO string
                created_at_str = self.created_at.isoformat()
            elif isinstance(self.created_at, str):
                # אם זה כבר string - השאר כמו שהוא
                created_at_str = self.created_at
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_approved_uploader': self.is_approved_uploader,
            'upload_request_status': self.upload_request_status,
            'created_at': created_at_str
            }

    def __repr__(self):
        """
        מה שמודפס כשעושים print(user)
        """
        return f'<User {self.username}>'
