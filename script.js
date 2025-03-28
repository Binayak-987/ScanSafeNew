document.addEventListener("DOMContentLoaded", function () {
    // Hide welcome page after 3 seconds
    setTimeout(() => {
        document.getElementById("welcome-page").style.opacity = "0";
        setTimeout(() => document.getElementById("welcome-page").remove(), 500);
    }, 3000);
});

function startScanner() {
    const scannerContainer = document.getElementById("scanner-container");
    scannerContainer.style.display = "block"; // Show scanner

    Quagga.init({
        inputStream: {
            type: "LiveStream",
            target: "#scanner-container",
            constraints: {
                width: 300, // Adjust camera width
                height: 200, // Adjust camera height
                facingMode: "environment" // Use back camera
            }
        },
        decoder: { readers: ["ean_reader", "upc_reader", "code_128_reader", "code_39_reader"] }
    }, function (err) {
        if (!err) {
            Quagga.start();
        }
    });

    Quagga.onDetected(data => {
        document.getElementById("barcode-input").value = data.codeResult.code;
        Quagga.stop();
        scannerContainer.style.display = "none"; // Hide scanner after scanning
        fetchProductInfo();
    });
}

function fetchProductInfo() {
    const barcode = document.getElementById("barcode-input").value;
    if (!barcode) {
        alert("Please enter or scan a barcode.");
        return;
    }

    fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 1) {
                const product = data.product;
                const ingredients = product.ingredients_text || "Not available";
                const sugars = product.nutriments["sugars"] || "Not available";
                const fats = product.nutriments["saturated-fat"] || "Not available";
                const additives = product.additives_tags ? product.additives_tags.join(", ") : "Not available";

                let warning = "";
                const selectedAllergens = Array.from(document.querySelectorAll("input[type=checkbox]:checked")).map(el => el.value);
                const customAllergen = document.getElementById("custom-allergen").value.trim().toLowerCase();
                if (customAllergen) selectedAllergens.push(customAllergen);

                selectedAllergens.forEach(allergen => {
                    if (ingredients.toLowerCase().includes(allergen)) {
                        warning += `<p style='color:red;'><strong>Warning:</strong> Contains ${allergen}!</p>`;
                    }
                });

                document.getElementById("product-info").innerHTML = `
                    <h2>${product.product_name || "Unknown Product"}</h2>
                    ${warning}
                    <p><strong>Ingredients:</strong> ${ingredients}</p>
                    <p><strong>Hidden Sugars:</strong> ${sugars}g</p>
                    <p><strong>Unhealthy Fats:</strong> ${fats}g</p>
                    <p><strong>Additives:</strong> ${additives}</p>
                `;
            } else {
                document.getElementById("product-info").innerHTML = "Product not found.";
            }
        })
        .catch(err => console.error("Error fetching product data:", err));
}
