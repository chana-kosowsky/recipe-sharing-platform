"""
routes/recipe_routes.py
=======================
כל הנתיבים (routes) הקשורים למתכונים.
======================
כל הנתיבים רשומים תחת Blueprint בשם 'recipe_bp'
"""


from flask import Blueprint, request, jsonify, current_app
from models import db, Recipe, IngredientEntry, Rating
from utils.auth import token_required, admin_required
from utils.image_processing import save_recipe_image, delete_recipe_images, allowed_file, get_file_size
import json

# יצירת Blueprint
recipe_bp = Blueprint('recipes', __name__)



# ===================================
# נתיבי מתכונים
# ===================================

@recipe_bp.route('/recipes', methods=['GET'])
def get_recipes():
    """
    מחזיר את כל המתכונים במערכת.
    """
    try:
        recipes = Recipe.query.all()
        recipes_list = [recipe.to_dict() for recipe in recipes]

        return jsonify({
            'recipes': recipes_list,
            'count': len(recipes_list)
        }), 200

    except Exception as e:
        return jsonify({'error': f'שגיאה בשליפת מתכונים: {str(e)}'}), 500


@recipe_bp.route('/recipes/<int:id>', methods=['GET'])
def get_recipe(id):
    """
    מחזיר מתכון ספציפי לפי ID.
    """
    try:
        recipe = Recipe.query.get(id)

        if not recipe:
            return jsonify({'error': 'המתכון לא נמצא'}), 404

        return jsonify({
            'recipe': recipe.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': f'שגיאה בשליפת המתכון: {str(e)}'}), 500


# ===================================
# יצירת מתכון חדש (עם תמונות!)
# ===================================
# הזהות נקבעת מהטוקן בעוגייה דרך @token_required - לא ממשהו ששלח הלקוח.
# זה מבטיח שמשתמש לא יכול ליצור מתכון בשם של מישהו אחר.

@recipe_bp.route('/recipes', methods=['POST'])
@token_required
def create_recipe(current_user):
    try:
        # ====================
        # שלב 1: קבלת נתונים מהטופס
        # ====================
        title = request.form.get('title')
        instructions = request.form.get('instructions')
        preparation_time = request.form.get('preparation_time')
        recipe_type = request.form.get('type')
        category = request.form.get('category')
        ingredients_json = request.form.get('ingredients')

        try:
            ingredients = json.loads(ingredients_json) if ingredients_json else []
        except json.JSONDecodeError:
            return jsonify({'error': 'פורמט רכיבים לא תקין'}), 400

        # ====================
        # שלב 2: בדיקת שדות חובה
        # ====================
        if not title:
            return jsonify({'error': 'שם המתכון הוא שדה חובה'}), 400
        if not instructions:
            return jsonify({'error': 'הוראות ההכנה הן שדה חובה'}), 400
        if not preparation_time:
            return jsonify({'error': 'זמן הכנה הוא שדה חובה'}), 400
        if not recipe_type:
            return jsonify({'error': 'סוג המתכון הוא שדה חובה'}), 400

        # ====================
        # שלב 3: בדיקת תקינות
        # ====================
        title = title.strip()
        if len(title) < 3:
            return jsonify({'error': 'שם המתכון חייב להכיל לפחות 3 תווים'}), 400
        if len(title) > 200:
            return jsonify({'error': 'שם המתכון ארוך מדי (מקסימום 200 תווים)'}), 400

        try:
            preparation_time = int(preparation_time)
            if preparation_time < 1:
                return jsonify({'error': 'זמן הכנה חייב להיות לפחות דקה אחת'}), 400
            if preparation_time > 1440:
                return jsonify({'error': 'זמן הכנה לא יכול לעלות על 24 שעות'}), 400
        except ValueError:
            return jsonify({'error': 'זמן הכנה חייב להיות מספר'}), 400

        valid_types = ['Dairy', 'Meat', 'Parve']
        if recipe_type not in valid_types:
            return jsonify({'error': f'סוג מתכון לא תקין. אפשרויות: {", ".join(valid_types)}'}), 400

        valid_categories = ['Main', 'Dessert', 'Salad', 'Soup', 'Bread', 'Beverage', 'Appetizer', 'Other']
        if category not in valid_categories:
            category = 'Other'

        # ====================
        # שלב 4: בדיקת הרשאת Uploader על המשתמש המחובר
        # ====================
        if not current_user.is_approved_uploader:
            return jsonify({'error': 'אין לך הרשאה להעלות מתכונים. פנה למנהל המערכת.'}), 403

        user_id = current_user.id

        # ====================
        # שלב 5: בדיקת ייחודיות
        # ====================
        existing_recipe = Recipe.query.filter_by(title=title).first()
        if existing_recipe:
            return jsonify({'error': 'קיים כבר מתכון עם שם זהה'}), 400

        # ====================
        #  שלב 6: טיפול בתמונה (עם וריאציות אמנותיות!)
        # ====================
        image_filename = None
        variation_paths = None

        if 'image' in request.files:
            file = request.files['image']

            if file and file.filename != '' and allowed_file(file.filename):
                # בדיקת גודל
                file_size = get_file_size(file)
                if file_size > current_app.config['MAX_FILE_SIZE']:
                    return jsonify({'error': 'התמונה גדולה מדי. מקסימום: 5MB'}), 400

                #  שמירה בתיקיית המשתמש!
                image_filename, variation_paths = save_recipe_image(
                    file=file,
                    upload_folder=current_app.config['UPLOAD_FOLDER'],
                    user_id=user_id,
                    recipe_title=title
                )

                if not image_filename:
                    return jsonify({'error': 'שגיאה בשמירת התמונה'}), 500
        # ====================
        #  שלב 7: יצירת המתכון (עם transaction!)
        # ====================
        new_recipe = Recipe(
            title=title,
            instructions=instructions.strip(),
            preparation_time=preparation_time,
            type=recipe_type,
            category=category,
            user_id=user_id,
            image_path=image_filename,  #  תמונה מקורית!
            variation_paths=variation_paths  #  3 וריאציות (JSON)
        )

        #  לא שומר מיד - מוסיף ל-session
        db.session.add(new_recipe)
        db.session.flush()  # מקבל ID אבל לא שומר סופית!

        # ====================
        #  שלב 8: הוספת רכיבים
        # ====================
        ingredients_added = 0

        if ingredients and isinstance(ingredients, list):
            for ing_data in ingredients:
                # בדיקה שיש את כל השדות הנדרשים
                if not all(k in ing_data for k in ['product', 'amount', 'unit']):
                    continue

                # בדיקת תקינות
                product = str(ing_data['product']).strip()
                if not product or len(product) < 2:
                    continue

                try:
                    amount = float(ing_data['amount'])
                    if amount <= 0:
                        continue
                except (ValueError, TypeError):
                    continue

                unit = str(ing_data['unit']).strip()
                if not unit:
                    continue

                # יצירת הרכיב
                ingredient = IngredientEntry(
                    recipe_id=new_recipe.id,
                    product=product,
                    amount=amount,
                    unit=unit
                )

                #  לא שומר מיד - מוסיף ל-session
                db.session.add(ingredient)
                ingredients_added += 1

            # ====================
            #  שלב 9: שמירה סופית - הכל ביחד!
            # ====================
            db.session.commit()  # כאן נשמר הכל בבת אחת!

            # ====================
            # הצלחה!
            # ====================
            return jsonify({
                'message': 'המתכון נוסף בהצלחה!',
                'recipe': new_recipe.to_dict(),
                'ingredients_added': ingredients_added
            }), 201

    except Exception as e:
        #  אם יש שגיאה - בטל הכל!
        db.session.rollback()
        print(f"❌ שגיאה ביצירת מתכון: {e}")
        return jsonify({'error': f'שגיאה ביצירת מתכון: {str(e)}'}), 500


# ===================================
# מחיקת מתכון (Admin בלבד)
# ===================================
# @admin_required דואג גם לאימות הטוקן וגם לבדיקת תפקיד Admin.
# הוסרו הפרמטרים user_id/user_role מה-URL - הם היו "אמונה עיוורת" בלקוח.

@recipe_bp.route('/recipes/<int:recipe_id>', methods=['DELETE'])
@admin_required
def delete_recipe(current_user, recipe_id):
    try:

        #  מציאת המתכון
        recipe = Recipe.query.get(recipe_id)

        if not recipe:
            return jsonify({'error': 'מתכון לא נמצא'}), 404

        recipe_title = recipe.title
        recipe_user_id = recipe.user_id

        #  מחיקת כל התמונות מתיקיית המשתמש
        deleted_images_count=0
        try:
            deleted_images_count = delete_recipe_images(
                upload_folder=current_app.config['UPLOAD_FOLDER'],
                user_id=recipe_user_id,
                image_path=recipe.image_path,
                variation_paths=recipe.variation_paths
            )
        except Exception as img_error:
            print(f"Image delete error: {img_error}")


            #  מחיקת המתכון מה-DB
            # SQLAlchemy ימחק אוטומטית את הרכיבים (cascade!)
        db.session.delete(recipe)
        db.session.commit()

        print(f"✅ המתכון '{recipe_title}' נמחק בהצלחה!")
        print(f"📊 סה\"כ נמחקו {(deleted_images_count)} תמונות")

        # שלב 5: החזרת תשובה
        return jsonify({
            'message': f'המתכון "{recipe_title}" נמחק בהצלחה',
            'deleted_recipe_id': recipe_id,
            'deleted_images_count': deleted_images_count
             }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ שגיאה במחיקת מתכון: {e}")
        return jsonify({'error': f'שגיאה במחיקת המתכון: {str(e)}'}), 500


# ===================================
# חיפוש מתכונים לפי רכיבים
# ===================================
@recipe_bp.route('/recipes/search-by-ingredients', methods=['POST'])
def search_recipes_by_ingredients():
    """
    מחפש מתכונים לפי רשימת רכיבים.
    """
    try:

        # שלב 1: קבלת הנתונים
        data = request.get_json()

        if not data or 'ingredients' not in data:
            return jsonify({'error': 'חסרה רשימת רכיבים'}), 400

        user_ingredients = data.get('ingredients', [])

        if not user_ingredients or not isinstance(user_ingredients, list):  # הרכיבים הם מסוג list
            return jsonify({'error': 'רשימת רכיבים לא תקינה'}), 400

        # הסרת רווחים והמרה לאותיות קטנות (normalization)
        user_ingredients = [ing.strip().lower() for ing in user_ingredients if ing.strip()]

        # האם נשאר רכיבים אחרי הסרת הרווחים
        if not user_ingredients:
            return jsonify({'error': 'לא נשלחו רכיבים'}), 400

        print(f"🔍 מחפש מתכונים לפי רכיבים: {user_ingredients}")

        # המרה ל-Set
        user_set = set(user_ingredients)

        #  שליפת כל המתכונים
        #   query בונה את השאילתה ו-all מבצע אות
        all_recipes = Recipe.query.all()

        if not all_recipes:
            return jsonify({
                'recipes': [],
                'message': 'אין מתכונים במערכת'
            }), 200

        #  חישוב ציון לכל מתכון
        results = []
        # מעבר בלולאה על כל אובייקטי המתכונים שהתקבלו ממסד הנתונים
        for recipe in all_recipes:
            # קבלת רשימת רכיבים של המתכון
            recipe_ingredients = [ing.product.strip().lower() for ing in recipe.ingredients]

            if not recipe_ingredients:
                continue  # דלג על מתכונים ללא רכיבים

            # המרה ל-Set
            recipe_set = set(recipe_ingredients)

            # חיתוך (Intersection) - מה משותף?
            common_ingredients = user_set & recipe_set

            # רכיבים חסרים
            missing_ingredients = recipe_set - user_set

            # חישוב ציון התאמה
            match_score = len(common_ingredients) / len(recipe_set)

            # הוספת לתוצאות
            results.append({
                'recipe': recipe.to_dict(),
                'match_score': round(match_score, 2),  # עיגול ל-2 ספרות
                'match_percentage': round(match_score * 100),  # אחוזים
                'matched_ingredients': list(common_ingredients),
                'missing_ingredients': list(missing_ingredients),
                'total_recipe_ingredients': len(recipe_set)
            })

        #   סינון

        # מסנן מתכונים עם התאמה נמוכה מדי (מתחת ל-20%)
        min_score = 0.2
        filtered_results = [r for r in results if r['match_score'] >= min_score]

        # מיון (לפי הציון הגבוה ביותר)
        sorted_results = sorted(filtered_results, key=lambda x: x['match_score'], reverse=True)

        # ====================
        # שלב 7: החזרת תוצאות
        # ====================
        return jsonify({
            'recipes': sorted_results,  # רשימת המתכונים הממוינת והמסוננת
            'count': len(sorted_results),  # מספר המתכונים שנמצאו
            'total_searched': len(all_recipes),  # מספר המתכונים שנסרקו
            'search_query': user_ingredients  # רשימת הרכיבים שהמשתמש הזין
        }), 200
    # טיפול בשגיאות לא צפויות (למניעת קריסת השרת)
    except Exception as e:
        print(f"❌ שגיאה בחיפוש מתכונים: {e}")
        # החזרת הודעת שגיאה עם קוד 500 (שגיאת שרת פנימית)
        return jsonify({'error': f'שגיאה בחיפוש: {str(e)}'}), 500


# ===================================
# דירוגים
# ===================================
# הזהות מגיעה מהטוקן - משתמש לא יכול לדרג בשם של מישהו אחר.

@recipe_bp.route('/recipes/<int:recipe_id>/rate', methods=['POST'])
@token_required
def rate_recipe(current_user, recipe_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'לא התקבלו נתונים'}), 400

        rating_value = data.get('rating')

        if rating_value is None:
            return jsonify({'error': 'חסר נתון rating'}), 400

        try:
            rating_value = int(rating_value)
        except ValueError:
            return jsonify({'error': 'דירוג חייב להיות מספר'}), 400

        user_id = current_user.id

        # בדיקת טווח דירוג
        if rating_value < 1 or rating_value > 5:
            return jsonify({'error': 'דירוג חייב להיות בין 1-5'}), 400

        print(f" משתמש {user_id} מדרג מתכון {recipe_id}: {rating_value} כוכבים")

        #   בדיקה שהמתכון קיים
        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'error': 'מתכון לא נמצא'}), 404

        #   בדיקה אם המשתמש כבר דירג
        existing_rating = Rating.query.filter_by(
            user_id=user_id,
            recipe_id=recipe_id
        ).first()

        if existing_rating:
            # עדכון דירוג קיים
            print(f"📝 עדכון דירוג קיים: {existing_rating.rating} → {rating_value}")
            existing_rating.rating = rating_value
            db.session.commit()
        else:
            # יצירת דירוג חדש
            print(f"✨ יצירת דירוג חדש")
            new_rating = Rating(
                rating=rating_value,
                user_id=user_id,
                recipe_id=recipe_id
            )
            db.session.add(new_rating)
            db.session.commit()

        # ====================
        # חישוב ממוצע חדש (תמיד!)
        # ====================
        all_ratings = Rating.query.filter_by(recipe_id=recipe_id).all()

        if all_ratings and len(all_ratings) > 0:
            total_sum = sum(r.rating for r in all_ratings)
            avg = total_sum / len(all_ratings)
            recipe.average_rating = round(avg, 2)
            print(f"📊 ממוצע חדש: {recipe.average_rating} (מתוך {len(all_ratings)} דירוגים)")
        else:
            # מקרה קצה (לא אמור להגיע לכאן)
            recipe.average_rating = float(rating_value)

        # שמירת הממוצע החדש
        db.session.commit()

        #  החזרת תשובה

        return jsonify({
            'message': 'הדירוג נשמר בהצלחה',
            'average_rating': recipe.average_rating,
            'total_ratings': len(all_ratings),
            'your_rating': rating_value
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ שגיאה בשמירת דירוג: {e}")
        return jsonify({'error': f'שגיאה: {str(e)}'}), 500


# ===================================
# קבלת הדירוג שהמשתמש המחובר נתן למתכון
# ===================================
# רק המשתמש המחובר רואה את הדירוג שלו עצמו - לא של אחרים.

@recipe_bp.route('/recipes/<int:recipe_id>/user-rating', methods=['GET'])
@token_required
def get_user_rating(current_user, recipe_id):
    try:
        rating = Rating.query.filter_by(
            user_id=current_user.id,
            recipe_id=recipe_id
        ).first()

        return jsonify({'rating': rating.rating if rating else None}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


