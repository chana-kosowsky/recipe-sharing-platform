from datetime import datetime
from .base import db, BaseModel
# ===================================
# ⭐ Rating - טבלת דירוגים
# ===================================
class Rating(BaseModel):  # הירושה מ-BaseModel חוסכת לנו לכתוב id, save ו-delete
    """
    דירוג של מתכון על ידי משתמש.
    יורש מ-BaseModel ומקבל אוטומטית את כל פונקציות התשתית.
    """
    __tablename__ = 'ratings'

    # הציון (1-5 כוכבים)
    rating = db.Column(db.Integer, nullable=False)

    # קשרי חוץ (Foreign Keys)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)

    # תאריך הדירוג
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # קשרים (Relationships)
    user = db.relationship('User', backref='user_ratings')


    def to_dict(self):
        """
        המרה למילון לצורך שליחת JSON ל-Angular
        """
        return {
            'id': self.id,
            'rating': self.rating,
            'user_id': self.user_id,
            'recipe_id': self.recipe_id,
            'username': self.user.username if self.user else 'Unknown',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }