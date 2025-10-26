// USDA Densities (g per US cup; tsp/tbsp scaled proportionally)
const densities = {
    'all-purpose flour': 120,
    'granulated sugar': 200,
    'brown sugar': 220,
    'powdered sugar': 120,
    'butter': 227,
    'vegetable oil': 216,
    'olive oil': 216,
    'cocoa powder': 82,
    'baking powder': 192,
    'baking soda': 288,
    'salt': 292,
    'milk': 244,
    'water': 237,
    'heavy cream': 238,
    'sour cream': 240,
    'eggs': 243, // ~4 large eggs/cup
    'honey': 336,
    'maple syrup': 312,
    'cornstarch': 120,
    'oats': 80
};

// Tsp/Tbsp to cup multipliers (for conversion)
const volumeMultipliers = { 
    'tsp': 1/48, 
    'teaspoon': 1/48, 
    'tbsp': 1/16, 
    'tablespoon': 1/16 
};

const knownUnitsSet = new Set([
    'cup', 'cups', 'tsp', 'teaspoons', 'teaspoon', 'tbsp', 'tablespoons', 'tablespoon',
    'g', 'gram', 'grams', 'oz', 'ounce', 'ounces', 'ml', 'l', 'liter', 'liters', 'pinch', 'dash'
]);

function scaleRecipe() {
    const recipeText = document.getElementById('recipe').value.trim();
    const original = parseInt(document.getElementById('original').value) || 1;
    const desired = parseInt(document.getElementById('desired').value) || 1;
    const bakingMode = document.getElementById('baking-mode').checked;

    if (!recipeText) { alert('Paste a recipe first!'); return; }
    if (original <= 0 || desired <= 0) { alert('Servings must be positive numbers.'); return; }

    const lines = recipeText.split('\n').filter(line => line.trim());
    const scaleFactor = desired / original;
    let tableBody = '';

    lines.forEach(line => {
        const parsed = parseIngredient(line);
        if (!parsed) return; // Skip invalid

        const scaledAmount = parsed.amount * scaleFactor;
        let originalDisplay = parsed.amount.toString();
        let scaledDisplay = Math.round(scaledAmount * 100) / 100;
        let unitDisplay = parsed.unit ? parsed.unit : '';
        let ingredientDisplay = parsed.ingredient;

        if (parsed.unit) {
            originalDisplay += ' ' + unitDisplay;
            scaledDisplay += ' ' + unitDisplay;
        } else {
            originalDisplay += ' ' + ingredientDisplay;
            scaledDisplay += ' ' + ingredientDisplay;
        }

        let grams = '';

        if (bakingMode && parsed.unit) {
            const unit = parsed.unit.toLowerCase();
            let volumeUnit = unit.replace(/s$/, '');
            if (volumeUnit === 'cup' || volumeMultipliers.hasOwnProperty(volumeUnit)) {
                let cups = parsed.amount;
                if (volumeMultipliers[volumeUnit]) {
                    cups *= volumeMultipliers[volumeUnit];
                }
                let densityKey = parsed.ingredient.toLowerCase();
                // Normalize flour variants
                if (densityKey.includes('purpose flour')) {
                    densityKey = 'all-purpose flour';
                }
                const density = densities[densityKey];
                grams = density ? Math.round(cups * density * scaleFactor) + 'g' : ' (Add density for grams)';
            }
        }

        tableBody += `<tr>
            <td>${ingredientDisplay}</td>
            <td>${originalDisplay}</td>
            <td>${scaledDisplay}</td>
            <td>${grams || '-'}</td>
        </tr>`;
    });

    document.querySelector('#scaled-table tbody').innerHTML = tableBody;
    document.getElementById('output').style.display = 'block';
}

// Supercharged parse: Handles mixed (2 1/4), fractions (1/2), ranges (2-3), decimals, plurals, no-units, adjectives; cleans names
function parseIngredient(line) {
    // Reordered regex: Mixed first, then simple fraction, range, decimal, integer
    const amountMatch = line.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:-\d+)?|\d+\.\d+|\d+)\s*(.+)$/i);
    if (!amountMatch) return null;

    let amountStr = amountMatch[1].trim();
    let amount;
    if (amountStr.includes(' ')) {
        // Mixed: "2 1/4"
        const [whole, frac] = amountStr.split(' ');
        const fracMatch = frac.match(/(\d+)\/(\d+)/);
        if (fracMatch) {
            amount = parseFloat(whole) + (parseFloat(fracMatch[1]) / parseFloat(fracMatch[2]));
        } else {
            amount = parseFloat(whole);
        }
    } else if (amountStr.includes('-')) {
        // Range: "2-3"
        const [low, high] = amountStr.split('-');
        amount = (parseFloat(low) + parseFloat(high)) / 2;
    } else if (amountStr.includes('/')) {
        // Fraction: "1/2"
        const [num, den] = amountStr.split('/');
        amount = parseFloat(num) / parseFloat(den);
    } else {
        amount = parseFloat(amountStr);
    }
    if (isNaN(amount)) return null;

    let rest = amountMatch[2].trim();
    let unit = '';
    let ingredient = rest;

    // Sort units by length descending to prefer plurals (e.g., 'cups' before 'cup')
    const knownUnitsArray = Array.from(knownUnitsSet).sort((a, b) => b.length - a.length);

    // Extract unit if known (case-insensitive start, full match length)
    for (let u of knownUnitsArray) {
        if (rest.toLowerCase().startsWith(u.toLowerCase())) {
            unit = rest.substring(0, u.length).trim();
            ingredient = rest.substring(u.length).trim();
            break;
        }
    }

    // If no unit found, treat as no-unit (e.g., "2 eggs")
    if (!unit) {
        unit = '';
        ingredient = rest;
    }

    // Clean ingredient: Trim extra spaces/hyphens
    ingredient = ingredient.replace(/^-+|-+$/g, '').trim();

    return { amount, unit, ingredient };
}