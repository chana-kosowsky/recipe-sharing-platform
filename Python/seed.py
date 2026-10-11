"""Populate the database with demo data.

Usage (from the Python/ folder):
    python seed.py           # seed the app's normal database (instance/recipes.db)
    python seed.py --temp    # dry run against a temporary database

Safe to run more than once: existing users and recipes are skipped.
"""
import argparse
import sys
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from werkzeug.security import generate_password_hash

from app import create_app
from config import Config
from models import db, User, Recipe, IngredientEntry, Rating

ADMIN_PASSWORD = "Admin123!Demo"


def build_app(use_temp):
    """Return (app, temp_root). With use_temp, point the app at a temporary DB."""
    temp_root = None
    if use_temp:
        temp_root = Path(tempfile.mkdtemp(prefix="recipe-platform-seed-"))
        temp_instance = temp_root / "instance"
        temp_uploads = temp_root / "uploads"
        temp_instance.mkdir(exist_ok=True)
        temp_uploads.mkdir(exist_ok=True)
        Config.BASE_DIR = str(temp_root)
        Config.SQLALCHEMY_DATABASE_URI = f"sqlite:///{temp_instance / 'recipes.db'}"
        Config.UPLOAD_FOLDER = str(temp_uploads)

    app = create_app()
    with app.app_context():
        db.create_all()
    return app, temp_root


def ensure_user(username, email, password, role, is_approved_uploader, upload_request_status):
    existing = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing:
        return existing, False

    user = User(
        username=username,
        email=email,
        password=generate_password_hash(password),
        role=role,
        is_approved_uploader=is_approved_uploader,
        upload_request_status=upload_request_status,
    )
    db.session.add(user)
    db.session.commit()
    return user, True


def ensure_recipe(title, category, recipe_type, instructions, preparation_time, user_id, ingredients):
    existing = Recipe.query.filter_by(title=title).first()
    if existing:
        return existing, False

    recipe = Recipe(
        title=title,
        category=category,
        type=recipe_type,
        instructions=instructions,
        preparation_time=preparation_time,
        user_id=user_id,
        image_path=None,
        variation_paths=None,
    )
    db.session.add(recipe)
    db.session.flush()

    for ingredient in ingredients:
        db.session.add(
            IngredientEntry(
                recipe_id=recipe.id,
                product=ingredient["product"],
                amount=float(ingredient["amount"]),
                unit=ingredient["unit"],
            )
        )

    db.session.commit()
    return recipe, True


def ensure_rating(user_id, recipe_id, value):
    existing = Rating.query.filter_by(user_id=user_id, recipe_id=recipe_id).first()
    if existing:
        return existing

    rating = Rating(user_id=user_id, recipe_id=recipe_id, rating=value)
    db.session.add(rating)
    db.session.commit()
    return rating


def average_ratings_for_recipe(recipe_id):
    ratings = Rating.query.filter_by(recipe_id=recipe_id).all()
    if not ratings:
        return 0.0
    return round(sum(r.rating for r in ratings) / len(ratings), 2)


RECIPE_SPECS = [
    {
        "title": "Creamy Spinach Pasta",
        "category": "Main",
        "type": "Dairy",
        "instructions": "Boil the pasta until al dente. Sauté garlic in olive oil, add spinach, cream, and parmesan. Fold in the pasta and season to taste.",
        "preparation_time": 30,
        "ingredients": [
            {"product": "Pasta", "amount": 250, "unit": "g"},
            {"product": "Spinach", "amount": 150, "unit": "g"},
            {"product": "Cream", "amount": 200, "unit": "ml"},
            {"product": "Parmesan", "amount": 50, "unit": "g"},
        ],
        "ratings": {"mira": 5, "dan": 4},
    },
    {
        "title": "Berry Cheesecake Cups",
        "category": "Dessert",
        "type": "Dairy",
        "instructions": "Blend the biscuits with melted butter and press into cups. Mix cream cheese, sugar, and vanilla until smooth. Top with berries and chill.",
        "preparation_time": 45,
        "ingredients": [
            {"product": "Cream cheese", "amount": 250, "unit": "g"},
            {"product": "Biscuits", "amount": 150, "unit": "g"},
            {"product": "Berries", "amount": 200, "unit": "g"},
            {"product": "Sugar", "amount": 40, "unit": "g"},
        ],
        "ratings": {"dan": 5, "sara": 4},
    },
    {
        "title": "Grilled Chicken Salad",
        "category": "Salad",
        "type": "Meat",
        "instructions": "Season the chicken with lemon and herbs. Grill until cooked through and slice. Toss greens, cucumber, and tomatoes together and serve with the chicken.",
        "preparation_time": 25,
        "ingredients": [
            {"product": "Chicken breast", "amount": 300, "unit": "g"},
            {"product": "Lettuce", "amount": 120, "unit": "g"},
            {"product": "Cucumber", "amount": 1, "unit": "whole"},
            {"product": "Tomatoes", "amount": 2, "unit": "whole"},
        ],
        "ratings": {"mira": 4, "yoni": 5},
    },
    {
        "title": "Beef Chili Bowl",
        "category": "Main",
        "type": "Meat",
        "instructions": "Brown the beef with onion and garlic. Add tomatoes, beans, chili spices, and simmer until thick. Serve hot with toppings.",
        "preparation_time": 40,
        "ingredients": [
            {"product": "Beef", "amount": 400, "unit": "g"},
            {"product": "Beans", "amount": 250, "unit": "g"},
            {"product": "Tomatoes", "amount": 300, "unit": "g"},
            {"product": "Onion", "amount": 1, "unit": "whole"},
        ],
        "ratings": {"sara": 5, "dan": 4},
    },
    {
        "title": "Lentil Vegetable Soup",
        "category": "Soup",
        "type": "Parve",
        "instructions": "Sauté the onion, carrot, and celery. Add lentils, stock, and spices, then simmer until the lentils are soft. Finish with lemon and parsley.",
        "preparation_time": 35,
        "ingredients": [
            {"product": "Lentils", "amount": 200, "unit": "g"},
            {"product": "Carrot", "amount": 2, "unit": "whole"},
            {"product": "Celery", "amount": 2, "unit": "stalks"},
            {"product": "Vegetable stock", "amount": 1.5, "unit": "L"},
        ],
        "ratings": {"mira": 5, "yoni": 4},
    },
    {
        "title": "Roasted Veggie Couscous",
        "category": "Main",
        "type": "Parve",
        "instructions": "Roast the vegetables with olive oil and spices until tender. Prepare couscous according to package instructions and mix with the vegetables.",
        "preparation_time": 30,
        "ingredients": [
            {"product": "Couscous", "amount": 250, "unit": "g"},
            {"product": "Pepper", "amount": 2, "unit": "whole"},
            {"product": "Zucchini", "amount": 2, "unit": "whole"},
            {"product": "Olive oil", "amount": 30, "unit": "ml"},
        ],
        "ratings": {"dan": 4, "sara": 5},
    },
]


def main():
    parser = argparse.ArgumentParser(description="Seed the recipe platform with demo data.")
    parser.add_argument("--temp", action="store_true",
                        help="dry run: use a temporary database instead of the app's real one")
    args = parser.parse_args()

    app, temp_root = build_app(args.temp)

    with app.app_context():
        admin, _ = ensure_user("admin", "admin@demo.local", ADMIN_PASSWORD, "Admin", True, "approved")
        uploader, _ = ensure_user("uploader_demo", "uploader@demo.local", "Uploader123!Demo",
                                  "Uploader", True, "approved")

        sample_users = {}
        for name, password in [("mira", "ReaderPass1!"), ("dan", "ReaderPass2!"),
                               ("sara", "ReaderPass3!"), ("yoni", "ReaderPass4!")]:
            sample_users[name], _ = ensure_user(name, f"{name}@demo.local", password,
                                                "Reader", False, "none")

        created, skipped = 0, 0
        for spec in RECIPE_SPECS:
            recipe, was_created = ensure_recipe(
                title=spec["title"],
                category=spec["category"],
                recipe_type=spec["type"],
                instructions=spec["instructions"],
                preparation_time=spec["preparation_time"],
                user_id=uploader.id,
                ingredients=spec["ingredients"],
            )
            created += was_created
            skipped += not was_created

            for username, value in spec["ratings"].items():
                ensure_rating(sample_users[username].id, recipe.id, value)

            recipe.average_rating = average_ratings_for_recipe(recipe.id)
            db.session.commit()

        print("========================================")
        print("Seed data ready")
        print("========================================")
        print(f"Admin username: {admin.username}")
        print(f"Admin password: {ADMIN_PASSWORD}")
        print(f"Approved uploader: {uploader.username} ({uploader.role})")
        print(f"Recipes created: {created} (already existed: {skipped})")
        print(f"Database: {Config.SQLALCHEMY_DATABASE_URI}")
        print("========================================")

    if temp_root:
        print(f"Dry run used a temporary folder: {temp_root}")
        print("Delete it when you are done.")


if __name__ == "__main__":
    main()