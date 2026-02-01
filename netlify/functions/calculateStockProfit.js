exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const purchasePrice = parseFloat(String(data.purchasePrice).replace(/,/g, ''));
        const currentPrice = parseFloat(String(data.currentPrice).replace(/,/g, ''));
        const quantity = parseInt(String(data.quantity).replace(/,/g, ''), 10);
        const taxRateInput = parseFloat(data.taxRate);

        if (isNaN(purchasePrice) || isNaN(currentPrice) || isNaN(quantity) || purchasePrice <= 0 || currentPrice <= 0 || quantity <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const taxRate = !isNaN(taxRateInput) ? taxRateInput / 100 : 0;

        const totalPurchaseAmount = purchasePrice * quantity;
        const totalCurrentAmount = currentPrice * quantity;
        const grossProfit = totalCurrentAmount - totalPurchaseAmount;

        // Existing logic mirror: Tax calculated on absolute gross profit, but subtracted only if profit > 0
        const taxAmount = Math.abs(grossProfit) * taxRate;
        const netProfit = grossProfit - (grossProfit > 0 ? taxAmount : 0);

        const profitRate = (grossProfit / totalPurchaseAmount) * 100;
        const netProfitRate = (netProfit / totalPurchaseAmount) * 100;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                totalPurchaseAmount,
                totalCurrentAmount,
                grossProfit,
                netProfit,
                profitRate,
                netProfitRate,
                taxAmount,
                taxRate
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
