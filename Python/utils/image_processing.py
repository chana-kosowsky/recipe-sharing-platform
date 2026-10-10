
import os
import json
import secrets
from datetime import datetime
from werkzeug.utils import secure_filename
from PIL import Image, ImageFilter, ImageEnhance


# ===================================
# פונקציות ולידציה
# ===================================
def allowed_file(filename):
    """
    בודק אם סיומת הקובץ מותרת.

    Args:
        filename (str): שם הקובץ

    Returns:
        bool: True אם הסיומת מותרת, אחרת False

       """
    # סוגי קבצים מותרים
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_size(file):
    """
    מחזיר את גודל הקובץ בבתים.

    Args:
        file: אובייקט הקובץ מ-request.files

    Returns:
        int: גודל הקובץ בבתים
    """
    file.seek(0, os.SEEK_END)  # עבור לסוף הקובץ
    size = file.tell()  # קבל את המיקום (=גודל)
    file.seek(0)  # חזור להתחלה
    return size
# ===================================
# 1. יצירת תיקייה למשתמש
# ===================================
def create_user_folder(upload_folder, user_id):
    """
    יוצר תיקייה למשתמש ספציפי.

    Args:
        upload_folder (str): התיקייה הראשית (uploads/)
        user_id (int): מזהה המשתמש

    Returns:
        str: נתיב התיקייה שנוצרה

    דוגמה:
        create_user_folder('/uploads', 5)
        → יוצר: /uploads/user_5/
    """
    user_folder = os.path.join(upload_folder, f'user_{user_id}')
    os.makedirs(user_folder, exist_ok=True)  # exist_ok=True = לא שגיאה אם קיים
    print(f"📁 תיקיית משתמש: {user_folder}")
    return user_folder


# ===================================
# 2. יצירת 3 וריאציות אמנותיות
# ===================================
def create_artistic_variations(file, base_filename, user_folder):
    """
    יוצר 3 וריאציות אמנותיות של תמונה:
    1. Grayscale - שחור לבן קלאסי
    2. Vibrant - אפקט זוהר/חי (במקום המסובב)
    3. Vintage - אפקט נוסטלגי
    """
    try:
        file.seek(0)  # חזור להתחלת הקובץ
        img = Image.open(file)
        # המרה ל-RGB אם צריך
        if img.mode != 'RGB':
            img = img.convert('RGB')

        variations = {}

        # ========================================
        # וריאציה 1: שחור-לבן (Grayscale)
        # ========================================
        img_grayscale = img.copy().convert('L').convert('RGB')
        filename_grayscale = f"{base_filename}_grayscale.jpg"
        img_grayscale.save(os.path.join(user_folder, filename_grayscale), 'JPEG', quality=85)
        variations['grayscale'] = filename_grayscale
        print(f"   🎨 שחור-לבן: {filename_grayscale}")
        # ========================================
        # וריאציה 2: אפקט זוהר וחי (Vibrant Glow)
        # ========================================
        print("🎨 יוצר וריאציה 2: אפקט זוהר...")
        img_vibrant = img.copy()

        # 1. שיפור צבעים (Saturation) - עושה את האוכל חי יותר
        color_enhancer = ImageEnhance.Color(img_vibrant)
        img_vibrant = color_enhancer.enhance(1.4)

        # 2. שיפור ניגודיות (Contrast) - מדגיש פרטים
        contrast_enhancer = ImageEnhance.Contrast(img_vibrant)
        img_vibrant = contrast_enhancer.enhance(1.2)

        # 3. הוספת חדות (Sharpness)
        sharpness_enhancer = ImageEnhance.Sharpness(img_vibrant)
        img_vibrant = sharpness_enhancer.enhance(2.0)

        filename_vibrant = f"{base_filename}_vibrant.jpg"
        img_vibrant.save(os.path.join(user_folder, filename_vibrant), 'JPEG', quality=90)
        variations['vibrant'] = filename_vibrant  # שינינו את המפתח מ-rotated ל-vibrant
        print(f"   ✨ זוהר: {filename_vibrant}")
        # ========================================
        # וריאציה 3: אפקט וינטג' (Vintage)
        # ========================================
        img_vintage = img.copy()
        width, height = img_vintage.size
        pixels = img_vintage.load()
        # אפקט ספיה (sepia)
        for py in range(height):
            for px in range(width):
                r, g, b = pixels[px, py]
                tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                pixels[px, py] = (min(255, tr), min(255, tg), min(255, tb))
        # טשטוש קל
        img_vintage = img_vintage.filter(ImageFilter.BLUR)
        # טשטוש קל
        img_vintage = ImageEnhance.Brightness(img_vintage).enhance(0.9)

        filename_vintage = f"{base_filename}_vintage.jpg"
        img_vintage.save(os.path.join(user_folder, filename_vintage), 'JPEG', quality=85)
        variations['vintage'] = filename_vintage
        print(f"   📷 וינטג': {filename_vintage}")
        img.close()
        return variations

    except Exception as e:
        print(f"❌ שגיאה ביצירת וריאציות: {e}")
        return None

    # ===================================
    # 3. שמירת תמונת מתכון (+ וריאציות)
    # ===================================


def save_recipe_image(file, upload_folder, user_id, recipe_title):
    """
    שומר תמונת מתכון + 3 וריאציות בתיקיית המשתמש.

    Args:
        file: אובייקט הקובץ
        upload_folder (str): תיקיית uploads הראשית
        user_id (int): מזהה המשתמש
        recipe_title (str): שם המתכון (לשם הקובץ)

    Returns:
        tuple: (image_filename, variation_paths_json)

        דוגמה:
            ('20231220_abc123_recipe_original.jpg', '{"grayscale": "..."}')
    """
    try:
        # שלב 1: יצירת תיקיית משתמש
        user_folder = create_user_folder(upload_folder, user_id)

        # שלב 2: יצירת שם בסיס ייחודי
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_str = secrets.token_hex(4)
        original_filename = secure_filename(file.filename)
        name_without_ext = os.path.splitext(original_filename)[0]

        base_filename = f"{timestamp}_{random_str}"

        # שלב 3: שמירת התמונה המקורית
        original_ext = os.path.splitext(original_filename)[1]
        image_filename = f"{base_filename}_original{original_ext}"
        original_filepath = os.path.join(user_folder, image_filename)
        file.save(original_filepath)
        print(f"✅ תמונה מקורית נשמרה: {image_filename}")

        # שלב 4: יצירת 3 וריאציות אמנותיות
        file.seek(0)  # חזור להתחלה
        variations = create_artistic_variations(file, base_filename, user_folder)
        # שלב 5: המרה ל-JSON
        variation_paths_json = None
        if variations:
            variation_paths_json = json.dumps(variations)
            print(f"🎨 נוצרו 3 וריאציות!")
        else:
            print("⚠️ לא ניתן ליצור וריאציות, ממשיך עם תמונה מקורית בלבד")

        return image_filename, variation_paths_json

    except Exception as e:
        print(f"❌ שגיאה בשמירת תמונה: {e}")
        return None, None

        # ===================================
        # 4. מחיקת כל התמונות של מתכון
        # ===================================


def delete_recipe_images(upload_folder, user_id, image_path, variation_paths):
    """
    מוחק את כל התמונות של מתכון (מקורית + 3 וריאציות).

    Args:
        upload_folder (str): תיקיית uploads הראשית
        user_id (int): מזהה המשתמש
        image_path (str): שם הקובץ המקורי
        variation_paths (str): JSON string של הוריאציות

    Returns:
        int: מספר הקבצים שנמחקו
    """
    deleted_count = 0
    user_folder = os.path.join(upload_folder, f'user_{user_id}')
    # מחיקת התמונה המקורית
    if image_path:
        original_path = os.path.join(user_folder, image_path)
        if os.path.exists(original_path):
            try:
                os.remove(original_path)
                deleted_count += 1
                print(f"🗑️ נמחקה תמונה מקורית: {image_path}")
            except Exception as e:
                print(f"⚠️ שגיאה במחיקת תמונה מקורית: {e}")

    #  מחיקת 3 הוריאציות
    if variation_paths:
        try:
            variations = json.loads(variation_paths)

            for variation_name, filename in variations.items():
                variation_path = os.path.join(user_folder, filename)
                if os.path.exists(variation_path):
                    try:
                        os.remove(variation_path)
                        deleted_count += 1
                        print(f"🗑️ נמחקה וריאציה ({variation_name}): {filename}")
                    except Exception as e:
                        print(f"⚠️ שגיאה במחיקת וריאציה {variation_name}: {e}")
        except json.JSONDecodeError:
            print("⚠️ שגיאה בפענוח variation_paths")
    return deleted_count
