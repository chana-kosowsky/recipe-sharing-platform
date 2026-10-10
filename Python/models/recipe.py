from datetime import datetime
from .base import db, BaseModel

# ===================================
# Recipe - טבלת מתכונים
# ===================================
class Recipe(BaseModel):
    """
    מחלקה לניהול מתכונים באתר.
    """

    __tablename__ = 'recipes'

    # ===== עמודות =====
    #מפתח ראשי
    id = db.Column(db.Integer, primary_key=True)
    #קטגוריה
    category = db.Column(db.String(50), default='Other', nullable=False)
    # כותרת המתכון
    title = db.Column(db.String(200), nullable=False)

    # הוראות הכנה
    instructions = db.Column(db.Text, nullable=False)

    # זמן הכנה (בדקות)
    preparation_time = db.Column(db.Integer, nullable=False)

    # סוג: 'Dairy' (חלבי), 'Meat' (בשרי), 'Parve' (פרווה)
    type = db.Column(db.String(20), nullable=False)

    # דירוג ממוצע (0-5)
    average_rating = db.Column(db.Float, default=0.0)

    # נתיב לתמונה
    image_path = db.Column(db.String(300), nullable=True)

    # ⭐ תמונות ווריאציה
    variation_paths = db.Column(db.Text, nullable=True)

    # תאריך יצירה
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ===== קשרים =====

    # קישור למשתמש שהעלה את המתכון
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # קישור למשתמש (relationship)
    # backref='recipes' מאפשר לכתוב: user.recipes
    #author = db.relationship('User', backref='recipes')

    # קישור לרכיבים
    # backref='recipe' מאפשר לכתוב: ingredient.recipe
    ingredients = db.relationship('IngredientEntry', backref='recipe', lazy=True, cascade='all, delete-orphan')
    ratings = db.relationship('Rating', backref='rated_recipe', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """
        ממיר את המתכון למילון.
        """
        created_at_str = None
        if self.created_at:
            if isinstance(self.created_at, datetime):
                created_at_str = self.created_at.isoformat()
            elif isinstance(self.created_at, str):
                created_at_str = self.created_at
        return {
            'id': self.id,
            'title': self.title,
            'instructions': self.instructions,
            'preparation_time': self.preparation_time,
            'type': self.type,
            'user_id':self.user_id,
            'category':self.category,
            'average_rating': self.average_rating,
            'image_path': self.image_path,
            'variation_paths': self.variation_paths,  # ← הוסף שורה זו
            'author': self.author.username if self.author else None,
            'created_at': created_at_str,
            'ingredients': [ingredient.to_dict() for ingredient in self.ingredients]
        }

    def __repr__(self):
        return f'<Recipe {self.title}>'
