from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ocr import extract_text
from parser import parse_receipt
from carbon import calculate_carbon
import os
import shutil

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]
    receipt_context: Optional[Dict[str, Any]] = None

class SummarizeRequest(BaseModel):
    items: List[Dict[str, Any]]
    total_carbon: float

@app.get("/")
def home():
    return {
        "message": "Carbon Footprint Receipt API is Running 🚀"
    }

@app.post("/upload")
async def upload_receipt(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # OCR
    ocr_text = extract_text(file_path)

    # Parse receipt
    items = parse_receipt(ocr_text)

    # Calculate carbon footprint
    carbon_items, total_carbon = calculate_carbon(items)

    return {
        "status": "success",
        "filename": file.filename,
        "items": carbon_items,
        "total_carbon": total_carbon
    }

@app.post("/summarize")
def summarize_receipt(req: SummarizeRequest):
    items = req.items
    total_carbon = req.total_carbon
    
    if not items:
        return {"summary": "No products scanned to summarize."}
        
    # Find highest carbon emitter
    sorted_items = sorted(items, key=lambda x: x.get("carbon", 0), reverse=True)
    highest_item = sorted_items[0] if sorted_items else None
    
    # Calculate savings
    total_savings = sum(item.get("saving", 0) for item in items)
    saving_percentage = round((total_savings / total_carbon * 100), 1) if total_carbon > 0 else 0
    
    # Trees equivalence: 1 mature tree absorbs ~22kg of CO2 per year
    trees_absorbed = round((total_savings / 22), 2)
    
    summary = (
        f"This transaction resulted in a total carbon footprint of {total_carbon:.1f} kg CO₂. "
        f"The primary source of emission was \"{highest_item['name']}\" which contributed "
        f"{highest_item['carbon']:.1f} kg CO₂. By substituting the recommended green alternatives "
        f"(for instance, replacing {highest_item['name']} with {highest_item['alternative']}), "
        f"you could save up to {total_savings:.1f} kg CO₂ (an estimated {saving_percentage}% reduction). "
        f"This carbon saving is equivalent to the annual atmospheric carbon absorption of {trees_absorbed:.2f} mature trees. "
        f"Choosing local plant-based items is a highly effective step in mitigating lifestyle emissions."
    )
    
    return {"summary": summary}

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    msg = req.message.lower()
    receipt = req.receipt_context
    
    response = ""
    
    # Context aware responses
    if receipt and receipt.get("items"):
        items = receipt["items"]
        total_co2 = receipt["total_carbon"]
        
        if "item" in msg or "purchase" in msg or "scanned" in msg or "buy" in msg:
            items_str = ", ".join([f"{i['name']} ({i['carbon']} kg CO2)" for i in items[:4]])
            response = f"Your scanned receipt shows a total footprint of {total_co2:.1f} kg CO₂. The items analyzed include: {items_str}. "
            high_emitters = [i for i in items if i.get("carbon", 0) >= 3.0]
            if high_emitters:
                response += f"The highest carbon footprint comes from {high_emitters[0]['name']}. Swapping it could make a major difference!"
            else:
                response += "Great job! Most of your items are low-carbon products."
            return {"response": response}
            
        if "alternative" in msg or "swap" in msg or "suggest" in msg or "replace" in msg:
            swaps = [f"replace {i['name']} with {i['alternative']} to save {i['saving']} kg CO2" for i in items if i.get("saving", 0) > 0]
            if swaps:
                response = "Here are the suggested swaps from your receipt:\n" + "\n• ".join(swaps) + "\n\nMaking these simple swaps reduces emissions significantly!"
            else:
                response = "No high-carbon swaps are required for your scanned items. Your current choices are already highly eco-friendly!"
            return {"response": response}
            
    # General queries
    if "milk" in msg or "dairy" in msg:
        response = (
            "Dairy milk has a carbon footprint of roughly 3.2 kg CO₂ per liter due to cattle digestion, "
            "feed logistics, and manure management. In comparison, plant-based alternatives like Soy Milk, "
            "Almond Milk, and Oat Milk emit only 0.8 to 1.2 kg CO₂ per liter. Swapping to plant protein saves "
            "about 2.0 kg CO₂ per liter, representing a 65% reduction."
        )
    elif "chicken" in msg or "beef" in msg or "meat" in msg:
        response = (
            "Meat production, especially beef, is extremely resource-intensive. Beef emits over 27 kg CO₂ "
            "per kg due to land clearing and cattle methane. Chicken is lower (~6.9 kg CO₂), but still far "
            "higher than plant proteins like Tofu (1.5 kg CO₂) or lentils (0.9 kg CO₂). Swapping chicken for tofu "
            "saves about 4.8 kg CO₂ per kg."
        )
    elif "recipe" in msg or "cook" in msg:
        response = (
            "Here is a low-carbon recipe recommended by the Gazette:\n\n"
            "Eco Tofu Stir-Fry:\n"
            "1. Sauté cubed tofu in a pan with 1 tbsp sesame oil.\n"
            "2. Add chopped local greens, tomatoes, ginger, and garlic.\n"
            "3. Season with soy sauce and serve over organic millets.\n\n"
            "This healthy meal feeds two and generates less than 1.0 kg CO₂ total!"
        )
    elif "streak" in msg or "points" in msg or "challenge" in msg:
        response = (
            "You earn 50 Eco-Points for scanning a receipt, plus 10 bonus points for each item. "
            "If you substitute high-carbon items with green alternatives, you gain additional points! "
            "Maintaining your daily check-in streak multiplies your points. You can spend points in the Rewards Shop "
            "to unlock compostable bags, sapling donations, or farmers market discounts."
        )
    else:
        response = (
            "The Carbon Gazette Editorial Desk is here to answer your sustainability questions. "
            "Did you know that buying local organic produce cuts transport carbon footprint by 15-20%? "
            "You can ask me questions like:\n"
            "• 'Why is dairy carbon so high?'\n"
            "• 'Give me an eco stir-fry recipe.'\n"
            "• 'What alternatives do you suggest on my receipt?'\n"
            "• 'How do I earn points and complete streaks?'"
        )
        
    return {"response": response}