import re

BLACKLIST = {
    "tax", "total", "subtotal", "change", "cash", "card", "visa", "mastercard",
    "balance", "discount", "coupon", "savings", "due", "payment", "receipt",
    "shop", "items", "amount", "invoice", "gst", "cgst", "sgst", "vat", "change due"
}

def parse_receipt(text_list):
    """
    Parses OCR text lines into structured items with names and prices.
    Handles lines like 'Milk 45.00', 'Bread ₹80', and separate lines of text and numbers.
    Filters out metadata noise like tax, subtotal, and payment methods.
    """
    items = []
    
    # Pre-clean lines
    cleaned_lines = []
    for line in text_list:
        line_str = str(line).strip()
        if line_str:
            cleaned_lines.append(line_str)
            
    i = 0
    while i < len(cleaned_lines):
        line = cleaned_lines[i]
        
        # Pattern 1: Check if line has both item name and a price, e.g. "Milk 4.50" or "Bread 80"
        # Match anything at start, followed by space/separator, followed by currency symbol (optional) and float/int number at the end
        match = re.search(r'^(.*?)\s+[$₹]?\s*(\d+(?:\.\d+)?)\s*$', line)
        if match:
            item_name = match.group(1).strip()
            price_val = match.group(2).strip()
            
            # Clean up the name (remove common receipt junk characters)
            item_name = re.sub(r'^[.*#\-–—\s]+', '', item_name)
            item_name = re.sub(r'[.*#\-–—\s]+$', '', item_name)
            
            name_lower = item_name.lower()
            is_blacklisted = any(black in name_lower for black in BLACKLIST)
            
            # If the item name is not purely numeric, not blacklisted, and has length
            if item_name and not re.match(r'^\d+$', item_name) and not is_blacklisted:
                try:
                    items.append({
                        "name": item_name.title(),
                        "price": float(price_val)
                    })
                except ValueError:
                    pass
            i += 1
            continue
            
        # Pattern 2: Single item line followed by a numeric price line, e.g.
        # line 1: "Milk"
        # line 2: "45.00" or "₹45"
        if i < len(cleaned_lines) - 1:
            next_line = cleaned_lines[i + 1]
            # Clean currency symbols
            price_match = re.match(r'^[$₹]?\s*(\d+(?:\.\d+)?)\s*$', next_line)
            
            # If the current line is NOT purely numeric (it's the item name) and next line is numeric
            if not re.match(r'^[$₹]?\s*\d+(?:\.\d+)?\s*$', line) and price_match:
                item_name = re.sub(r'^[.*#\-–—\s]+', '', line)
                item_name = re.sub(r'[.*#\-–—\s]+$', '', item_name)
                
                name_lower = item_name.lower()
                is_blacklisted = any(black in name_lower for black in BLACKLIST)
                
                if item_name and not is_blacklisted:
                    try:
                        items.append({
                            "name": item_name.title(),
                            "price": float(price_match.group(1))
                        })
                    except ValueError:
                        pass
                i += 2
                continue
                
        i += 1
        
    return items