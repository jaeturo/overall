exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const price = parseFloat(String(data.price).replace(/,/g, ''));
        const propertyType = data.propertyType; // 'residential' or 'nonResidential'
        const homeCount = data.homeCount; // 'one', 'two', 'three'
        const isFirstHome = data.isFirstHome === true || data.isFirstHome === "true";

        if (isNaN(price) || price <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        let baseRate = 0.01;
        if (price > 60000000 && price <= 150000000) {
            baseRate = 0.02;
        } else if (price > 150000000) {
            baseRate = 0.03;
        }

        let surchargeRate = 0;
        if (propertyType === 'residential') {
            if (isFirstHome && price <= 600000000) {
                baseRate = Math.min(baseRate, 0.01);
            }
            if (homeCount === 'two') {
                surchargeRate = 0.02;
            } else if (homeCount === 'three') {
                surchargeRate = 0.04;
            }
        } else {
            // Non-residential usually fixed 4% or similar but frontend logic implies default baseRate logic applies only to residential?
            // Wait, frontend logic: `if (price > 60...)` is OUTSIDE `if (propertyType === 'residential')`.
            // So Base Rate logic applies to ALL? 
            // Actually usually commercial is fixed 4.6% total.
            // But I MUST REPLICATE FRONTEND LOGIC exactly.
            // Frontend:
            // let baseRate = 0.01... (logic)
            // if (propertyType === 'residential') { ... logic ... }
            // So non-residential uses the same price-based baseRate?? That seems wrong for real world but I must match existing code behavior unless clearly bug.
            // Actually, let's re-read frontend code carefully.
            // `if (propertyType === 'residential')` block handles FirstHome and Surcharge.
            // If non-residential, it just skips that block.
            // So non-residential gets baseRate 1, 2, or 3% based on price.
            // This is scientifically likely wrong (Communication to user?), but I will clone it for now to avoid logic drift.
        }

        const totalRate = baseRate + surchargeRate;
        const acquisitionTax = price * totalRate;
        const localEducationTax = acquisitionTax * 0.1;
        const specialTax = (propertyType === 'residential' && homeCount === 'three') ? acquisitionTax * 0.1 : 0;
        const totalTax = acquisitionTax + localEducationTax + specialTax;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                price,
                baseRate,
                surchargeRate,
                totalRate,
                acquisitionTax,
                localEducationTax,
                specialTax,
                totalTax
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
