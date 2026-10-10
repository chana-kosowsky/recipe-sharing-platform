from .base import db, BaseModel
# ===================================
# IngredientEntry - טבלת רכיבים
# ===================================
class IngredientEntry(BaseModel):
    """
    מחלקה לניהול רכיבים במתכון.

    למה טבלה נפרדת?
    כי מתכון אחד יכול להכיל הרבה רכיבים,
    וכל רכיב צריך: שם, כמות, יחידת מידה.

    דוגמה:
    מתכון לעוגה:
    - קמח, 2, כוסות
    - ביצים, 3, יחידות
    - סוכר, 1.5, כוסות

    כל שורה למעלה = אובייקט IngredientEntry אחד
    """

    __tablename__ = 'ingredient_entries'

    # ===== קישור למתכון =====
    # כל רכיב שייך למתכון מסוים
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.id'), nullable=False)

    # ===== פרטי הרכיב =====

    # שם הרכיב (לדוגמה: "קמח", "ביצים", "סוכר")
    product = db.Column(db.String(100), nullable=False)

    # כמות (מספר עשרוני - למשל 2.5)
    amount = db.Column(db.Float, nullable=False)

    # יחידת מידה (לדוגמה: "כוס", "גרם", "יחידה", "כפית")
    unit = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        """
        ממיר למילון.
        """
        return {
            'id': self.id,
            'product': self.product,
            'amount': self.amount,
            'unit': self.unit
        }

    def __repr__(self):
        return f'<Ingredient {self.product} - {self.amount} {self.unit}>'
