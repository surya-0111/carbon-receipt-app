import json
import os

# Ensure the database file is read relative to the backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "carbon_db.json")

with open(db_path, "r") as f:
    carbon_db = json.load(f)

def predict_carbon_and_alternative(name: str):
    """
    AIML Heuristic Engine:
    Classifies arbitrary items into categories and predicts carbon and alternative.
    """
    name_lower = name.lower()
    
    # 1. Check exact/substring matching against carbon_db
    for db_key, val in carbon_db.items():
        if db_key.lower() in name_lower or name_lower in db_key.lower():
            return val["carbon"], val["alternative"], val["saving"]
            
    # 2. Heuristic AIML patterns for unseen items
    patterns = {
        "beef": {
            "carbon": 27.0, 
            "alternative": "Tofu / Lentils", 
            "saving": 25.5, 
            "keywords": ["beef", "steak", "hamburger", "veal", "mutton", "lamb", "pork", "bacon", "sausage", "ham", "ribs", "meat"]
        },
        "poultry": {
            "carbon": 6.9, 
            "alternative": "Tofu / Tempeh", 
            "saving": 5.4, 
            "keywords": ["chicken", "poultry", "turkey", "duck", "nuggets", "breast", "wings"]
        },
        "seafood": {
            "carbon": 5.4, 
            "alternative": "Seaweed / Plant-based Fish", 
            "saving": 3.9, 
            "keywords": ["fish", "salmon", "shrimp", "tuna", "crab", "lobster", "seafood", "prawns", "cod", "fillet"]
        },
        "dairy": {
            "carbon": 3.2, 
            "alternative": "Soy Milk / Oat Milk", 
            "saving": 2.0, 
            "keywords": ["milk", "cheese", "butter", "cream", "yogurt", "curd", "paneer", "dairy", "mozzarella", "cheddar", "ghee"]
        },
        "egg": {
            "carbon": 4.5, 
            "alternative": "Plant-based Egg Substitutes", 
            "saving": 3.1, 
            "keywords": ["egg", "eggs", "omelette"]
        },
        "grain": {
            "carbon": 2.5, 
            "alternative": "Millets / Quinoa", 
            "saving": 1.5, 
            "keywords": ["rice", "wheat", "flour", "bread", "pasta", "grain", "oats", "cereal", "bun", "noodle", "bagel"]
        },
        "veg": {
            "carbon": 0.8, 
            "alternative": "Locally Grown Organic Vegetables", 
            "saving": 0.4, 
            "keywords": ["tomato", "potato", "onion", "carrot", "broccoli", "spinach", "vegetable", "greens", "cabbage", "garlic", "ginger", "pepper", "salad"]
        },
        "fruit": {
            "carbon": 0.6, 
            "alternative": "Local Seasonal Fruits", 
            "saving": 0.3, 
            "keywords": ["apple", "banana", "orange", "grape", "mango", "berry", "fruit", "lemon", "peach", "pear", "berry", "strawberries"]
        },
        "beverage": {
            "carbon": 1.5, 
            "alternative": "Tap Water / Homemade Brews", 
            "saving": 1.0, 
            "keywords": ["soda", "coke", "juice", "coffee", "tea", "beer", "wine", "drink", "cola", "pepsi", "sprite"]
        }
    }
    
    for cat, info in patterns.items():
        for kw in info["keywords"]:
            if kw in name_lower:
                return info["carbon"], info["alternative"], info["saving"]
                
    # 3. Default fallback
    return 1.2, "Plant-based alternatives", 0.4

def calculate_carbon(items):
    total = 0
    results = []

    for item in items:
        name = item["name"]
        
        # Predict values using heuristic AIML
        carbon, alternative, saving = predict_carbon_and_alternative(name)
        
        total += carbon

        results.append({
            "name": name,
            "price": item["price"],
            "carbon": carbon,
            "alternative": alternative,
            "saving": saving
        })

    return results, round(total, 2)