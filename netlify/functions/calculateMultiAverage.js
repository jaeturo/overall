exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const stocks = data.stocks; // Expecting array of { name, purchasePrice, quantity }

        if (!Array.isArray(stocks) || stocks.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "No stocks provided" }) };
        }

        let totalInvestment = 0;
        let totalQuantity = 0;
        const stockDetails = [];

        for (const stock of stocks) {
            const name = stock.name;
            const price = parseFloat(String(stock.purchasePrice).replace(/,/g, ''));
            const qty = parseInt(String(stock.quantity).replace(/,/g, ''), 10);

            if (!name || isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
                continue; // Skip invalid or panic? Let's skip invalid rows or error. 
                // Frontend validation should catch most, but backend should be safe.
                // Let's error if critical data missing.
                return { statusCode: 400, body: JSON.stringify({ error: "Invalid stock data" }) };
            }

            const investment = price * qty;
            totalInvestment += investment;
            totalQuantity += qty;

            stockDetails.push({
                name,
                purchasePrice: price,
                quantity: qty,
                investment
            });
        }

        if (stockDetails.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "No valid stocks to calculate" }) };
        }

        const overallAveragePrice = totalQuantity > 0 ? totalInvestment / totalQuantity : 0;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stockDetails,
                totalInvestment,
                totalQuantity,
                overallAveragePrice,
                count: stockDetails.length
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
