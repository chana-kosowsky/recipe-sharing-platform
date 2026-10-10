"""
routes/ai_routes.py - שף AI (Gemini)
====================================
נתיבי AI שמשתמשים ב-Gemini API (Google) להציע התאמות למתכונים
ולענות על שאלות בישול.
המפתח נשמר ב-.env (GEMINI_API_KEY) ולא נחשף לפרונטאנד.

הוראות ה-AI כתובות באנגלית (LLMs נשמעים טוב יותר להנחיות באנגלית),
הפלט מתבקש מפורשות בעברית.
"""

import os
import json
from flask import Blueprint, request, jsonify
import google.generativeai as genai
from models import Recipe

ai_bp = Blueprint('ai_bp', __name__)

# שם המודל - ניתן לעקוף עם משתנה סביבה GEMINI_MODEL
# gemini-2.0-flash = מודל עיקרי, מהיר וזול, תמיכה טובה בעברית
# חלופות: gemini-1.5-flash, gemini-1.5-pro (איכות גבוהה יותר, יקר יותר)
MODEL_NAME = os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash')

# האם כבר קונפגר את ה-SDK (עושים את זה פעם אחת)
_configured = False


def _ensure_configured():
    """מוודא שה-SDK של Gemini מקונפג עם המפתח, בפעם הראשונה שצריך."""
    global _configured
    if not _configured:
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise RuntimeError('GEMINI_API_KEY חסר או לא הוגדר ב-.env')
        # שינוי: הוספת transport='rest' כדי לעקוף את בעיות ה-gRPC של נטפרי
        genai.configure(api_key=api_key, transport='rest')
        _configured = True



def _recipe_context(recipe):
    """בונה תיאור טקסטואלי של המתכון להעברה כקונטקסט ל-AI."""
    ing_lines = [
        f"- {ing.amount} {ing.unit} {ing.product}"
        for ing in recipe.ingredients
    ]
    ingredients_block = "\n".join(ing_lines) if ing_lines else "(no ingredients listed)"
    return (
        f"Recipe title: {recipe.title}\n"
        f"Category: {recipe.category}\n"
        f"Type (Kosher classification): {recipe.type}\n"
        f"Prep time: {recipe.preparation_time} minutes\n\n"
        f"Ingredients:\n{ingredients_block}\n\n"
        f"Instructions:\n{recipe.instructions}"
    )


def _history_to_gemini(history):
    """
    ממיר את ההיסטוריה מהפרונט (role: user/model) לפורמט של Gemini.
    שימו לב: בניגוד לגרסת Groq, כאן *אין* צורך להמיר 'model' ל-'assistant' -
    Gemini משתמש באותם שמות roles ('user'/'model') כמו הפרונטאנד.
    """
    converted = []
    for h in history[-10:]:  # 10 הודעות אחרונות לקיצור context
        role = h.get('role')
        if role not in ('user', 'model'):
            continue
        text = (h.get('text') or '').strip()
        if text:
            converted.append({'role': role, 'parts': [text]})
    return converted


# ===================================
# /api/ai/chat - צ'אט חופשי עם השף בהקשר של מתכון
# ===================================
@ai_bp.route('/ai/chat', methods=['POST'])
def ai_chat():
    """
    מקבל: { recipe_id, message, history?: [{role: 'user'|'model', text: '...'}] }
    מחזיר: { reply: '...' }
    """
    try:
        data = request.get_json() or {}
        recipe_id = data.get('recipe_id')
        message = (data.get('message') or '').strip()
        history = data.get('history') or []

        if not message:
            return jsonify({'error': 'חסר תוכן להודעה'}), 400
        if not recipe_id:
            return jsonify({'error': 'חסר recipe_id'}), 400

        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'error': 'המתכון לא נמצא'}), 404

        # הנחיית מערכת באנגלית - תוכן המתכון נשאר בעברית כי הוא דאטה
        system_instruction = (
            "You are \"שף AI\" (Chef AI), a friendly cooking assistant for the Hebrew "
            "recipe site TASTE. The user is viewing the recipe shown below.\n\n"
            "Rules:\n"
            "- ALWAYS respond in Hebrew. Never respond in English.\n"
            "- Use a warm, professional, conversational tone.\n"
            "- Keep answers concise: 1-3 short paragraphs typically. Use bullet points "
            "for substitution lists or multi-step suggestions.\n"
            "- Stay grounded in the recipe context: ingredients, technique, timing, "
            "substitutions, scaling, troubleshooting, and food-safety questions.\n"
            "- If the user asks something unrelated to cooking, politely steer back to "
            "the recipe (in Hebrew).\n"
            "- Do not invent ingredients that are not in the original recipe unless the "
            "user explicitly asks for a substitution.\n\n"
            "Recipe context (Hebrew content - pass through as-is):\n"
            "---\n"
            f"{_recipe_context(recipe)}\n"
            "---"
        )

        _ensure_configured()

        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction,
            generation_config={
                'temperature': 0.7,
                'max_output_tokens': 1024,
            }
        )

        # בניית היסטוריית הצ'אט (בלי ההודעה האחרונה) ואז שליחת ההודעה החדשה
        chat = model.start_chat(history=_history_to_gemini(history))
        response = chat.send_message(message)

        reply_text = (response.text or '').strip()
        if not reply_text:
            reply_text = 'מצטערת, לא הצלחתי להבין את השאלה. אפשר לנסות שוב?'

        return jsonify({'reply': reply_text}), 200

    except RuntimeError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'שגיאה בקריאה ל-AI: {str(e)}'}), 500


# ===================================
# /api/ai/adapt - התאמת מתכון (טבעוני / חצי / ללא גלוטן וכו')
# ===================================
# הוראות ה-AI לכל סוג התאמה - באנגלית, הפלט המבוקש מהמודל הוא בעברית
ADAPTATIONS = {
    'vegan': (
        "Convert this recipe to fully vegan. Remove ALL animal-derived ingredients "
        "(meat, poultry, fish, eggs, dairy, honey, gelatin) and replace each with a "
        "suitable plant-based substitute. Adjust quantities where the substitute "
        "behaves differently from the original."
    ),
    'gluten_free': (
        "Convert this recipe to gluten-free. Replace wheat flour, semolina, breadcrumbs, "
        "and any gluten-containing ingredient with a gluten-free alternative (rice "
        "flour, almond flour, GF flour blend, etc.). Adjust binders/leaveners if needed."
    ),
    'lactose_free': (
        "Convert this recipe to lactose-free. Replace all dairy products (milk, cream, "
        "butter, cheese, yogurt) with plant-based or lactose-free alternatives. Keep "
        "texture and flavor as close to the original as possible."
    ),
    'half': (
        "Halve all ingredient quantities. Keep the SAME list of ingredients and the "
        "SAME preparation steps. Do not remove ingredients."
    ),
    'double': (
        "Double all ingredient quantities. Keep the SAME list of ingredients and the "
        "SAME preparation steps. If a larger batch would require more cooking/baking "
        "time (e.g. a bigger pan in the oven), increase preparation_time accordingly."
    ),
}

# שמות עבריים לכל סוג התאמה - מוצגים למשתמש
ADAPTATION_LABELS = {
    'vegan': 'גרסה טבעונית',
    'gluten_free': 'גרסה ללא גלוטן',
    'lactose_free': 'גרסה ללא לקטוז',
    'half': 'חצי כמות',
    'double': 'כפול כמות',
}


@ai_bp.route('/ai/adapt', methods=['POST'])
def ai_adapt():
    print("im in")
    """
    מקבל: { recipe_id, adaptation: 'vegan'|'gluten_free'|'lactose_free'|'half'|'double' }
    מחזיר: { adapted_recipe: {...}, adaptation, label }
    """
    try:
        data = request.get_json() or {}
        recipe_id = data.get('recipe_id')
        adaptation = data.get('adaptation')

        if not recipe_id:
            return jsonify({'error': 'חסר recipe_id'}), 400
        if adaptation not in ADAPTATIONS:
            return jsonify({
                'error': f'התאמה לא תקינה. אפשרויות: {list(ADAPTATIONS.keys())}'
            }), 400

        recipe = Recipe.query.get(recipe_id)
        if not recipe:
            return jsonify({'error': 'המתכון לא נמצא'}), 404

        # מערכת ממוקדת בפלט JSON
        system_message = (
            "You are an expert chef who adapts Hebrew recipes. "
            "You MUST respond with ONLY a valid JSON object - no markdown, no code "
            "fences, no commentary. All text values in the JSON must be in Hebrew."
        )

        adapt_instruction = ADAPTATIONS[adaptation]
        user_message = (
            "Adapt this Hebrew recipe with the following transformation:\n"
            f"{adapt_instruction}\n\n"
            "Original recipe (Hebrew content - preserve names and units as-is when "
            "possible):\n"
            "---\n"
            f"{_recipe_context(recipe)}\n"
            "---\n\n"
            "Respond with ONLY this JSON shape (no other text). The output MUST be "
            "valid JSON:\n"
            "{\n"
            '  "title": "<adapted recipe title in Hebrew>",\n'
            '  "preparation_time": <integer minutes>,\n'
            '  "ingredients": [\n'
            '    {"product": "<ingredient name in Hebrew>", "amount": "<quantity as '
            'string>", "unit": "<unit in Hebrew, e.g. כוסות, גרם, כפות>"}\n'
            "  ],\n"
            '  "instructions": "<updated preparation steps in Hebrew, newlines '
            'between steps allowed>",\n'
            '  "summary_of_changes": "<1-2 sentence summary in Hebrew of what '
            'changed vs the original>"\n'
            "}"
        )

        _ensure_configured()

        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_message,
            generation_config={
                'temperature': 0.5,
                'max_output_tokens': 2048,
                'response_mime_type': 'application/json',
            }
        )

        response = model.generate_content(user_message)
        raw_text = (response.text or '').strip()

        try:
            adapted = json.loads(raw_text)
        except json.JSONDecodeError:
            return jsonify({
                'error': 'AI החזיר תגובה לא תקינה. אפשר לנסות שוב.',
                'raw': raw_text[:500]
            }), 500

        return jsonify({
            'adapted_recipe': adapted,
            'adaptation': adaptation,
            'label': ADAPTATION_LABELS[adaptation]
        }), 200

    except RuntimeError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'שגיאה בקריאה ל-AI: {str(e)}'}), 500