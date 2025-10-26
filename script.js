function scaleRecipe() {
    const recipeInput = document.getElementById('recipe-input').value.trim();
    const originalServings = parseInt(document.getElementById('original-servings').value);
    const desiredServings = parseInt(document.getElementById('desired-servings').value);
    const bakingMode = document.getElementById('baking-mode').checked;

    if (!recipeInput || originalServings <= 0 || desiredServings <= 0) {
        alert('Please enter a valid recipe and servings!');
        return;
    }

    const lines = recipeInput.split('\n').map(line => line.trim()).filter(line => line);
    const tableBody = document.querySelector('#scaled-table tbody');
    tableBody.innerHTML = '';
    const outputSection = document.getElementById('output-section');
    outputSection.style.display = 'block';

    // USDA Densities (g per US cup; tsp/tbsp scaled proportionally)
    const densities = {
        'all-purpose flour': 120, 'granulated sugar': 200, 'brown sugar': 220, 'powdered sugar': 120,
        'butter': 227, 'vegetable oil': 216, 'olive oil': 216, 'cocoa powder': 82,
        'baking powder': 192, 'baking soda': 288, 'salt': 292, 'milk': 244,
        'water': 237, 'heavy cream': 238, 'sour cream': 240, 'eggs': 243,
        'honey': 336, 'maple syrup': 312, 'cornstarch': 120, 'oats': 80
    };

    lines.forEach(line => {
        const match = line.match(/(\d+\.?\d*)\s*(cups?|tsp|tbsp|oz|ml|grams?)\s*(.*)/i);
        if (match) {
            const quantity = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            const ingredient = match[3].toLowerCase().trim();
            console.log('Matched:', ingredient); // Debug log
            const scaleFactor = desiredServings / originalServings;

            let scaledQuantity = quantity * scaleFactor;
            let scaledUnit = unit;
            let weight = 'N/A';

            if (bakingMode && (unit === 'cups' || unit === 'tsp' || unit === 'tbsp')) {
                const density = densities[ingredient] || 0;
                if (density > 0) {
                    if (unit === 'cups') weight = (scaledQuantity * density).toFixed(0) + 'g';
                    else if (unit === 'tsp') weight = (scaledQuantity * density / 48).toFixed(0) + 'g'; // 1 cup = 48 tsp
                    else if (unit === 'tbsp') weight = (scaledQuantity * density / 16).toFixed(0) + 'g'; // 1 cup = 16 tbsp
                } else {
                    weight = '(Add density for ' + ingredient + '...)';
                }
                scaledQuantity = scaledQuantity.toFixed(1);
            } else {
                scaledQuantity = scaledQuantity.toFixed(1);
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ingredient}</td>
                <td>${quantity} ${unit}</td>
                <td>${scaledQuantity} ${scaledUnit}</td>
                <td>${weight}</td>
            `;
            tableBody.appendChild(row);
        }
    });
}