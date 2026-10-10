
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# ===================================
# BaseModel - מחלקת הבסיס
# ===================================
class BaseModel(db.Model):
    """
    מחלקת בסיס לכל המודלים האחרים.

    מה זה עושה?
    -----------
    כל מחלקה שיורשת מ-BaseModel תקבל אוטומטית:
    1. שדה id (מזהה ייחודי)
    2. מתודת save() לשמירה
    3. מתודת delete() למחיקה

    למה __abstract__ = True?
    SQLAlchemy לא ייצור טבלה בשביל BaseModel עצמה,
    רק בשביל המחלקות שיורשות ממנה (User, Recipe וכו')
    """

    __abstract__ = True  # זו לא טבלה אמיתית, רק תבנית

    # הגדרת עמודה (Column) במסד הנתונים
    # db.Integer = מספר שלם
    # primary_key=True = זה המפתח הראשי (ייחודי לכל שורה)
    # autoincrement=True = המספר יעלה אוטומטית (1, 2, 3...)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    def save(self):
        """
        מתודה לשמירת האובייקט במסד הנתונים.

        איך זה עובד?
        -------------
        1. db.session.add(self) - מוסיף את האובייקט ל"סשן" (תור של שינויים)
        2. db.session.commit() - מבצע את כל השינויים בפועל ב-DB

        למה try-except?
        אם יש שגיאה (למשל, email כפול), אנחנו עושים rollback -
        מבטלים את השינויים ולא משאירים את ה-DB במצב מקולקל.

        דוגמה לשימוש:
        -------------
        user = User(username='sarah', email='sarah@mail.com')
        user.save()  # שומר את המשתמש ב-DB
        """
        try:
            db.session.add(self)  # הוסף לתור
            db.session.commit()  # בצע את השינויים
            return True
        except Exception as e:
            db.session.rollback()  # ביטול במקרה של שגיאה
            print(f"שגיאה בשמירה: {e}")
            return False

    def delete(self):
        """
        מתודה למחיקת האובייקט מהמסד נתונים.

        דוגמה:
        ------
        user = User.query.get(5)  # מביא משתמש עם id=5
        user.delete()             # מוחק אותו
        """
        try:
            db.session.delete(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            print(f"שגיאה במחיקה: {e}")
            return False
