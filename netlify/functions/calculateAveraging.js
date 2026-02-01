exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const currentPrice = parseFloat(String(data.currentPrice).replace(/,/g, ''));
        const avgPrice = parseFloat(String(data.avgPrice).replace(/,/g, ''));
        const currentQuantity = parseInt(String(data.currentQuantity).replace(/,/g, ''), 10);
        const targetAvgPrice = parseFloat(String(data.targetAvgPrice).replace(/,/g, ''));

        if (isNaN(currentPrice) || isNaN(avgPrice) || isNaN(currentQuantity) || isNaN(targetAvgPrice) ||
            currentPrice <= 0 || avgPrice <= 0 || currentQuantity <= 0 || targetAvgPrice <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        // Logic:
        // TargetAvg = (CurrentTotal + AddTotal) / (CurrentQty + AddQty)
        // T = ( (P_avg * Q_cur) + (P_cur * Q_add) ) / (Q_cur + Q_add)
        // T * (Q_cur + Q_add) = (P_avg * Q_cur) + (P_cur * Q_add)
        // T*Q_cur + T*Q_add = P_avg*Q_cur + P_cur*Q_add
        // T*Q_add - P_cur*Q_add = P_avg*Q_cur - T*Q_cur
        // Q_add * (T - P_cur) = Q_cur * (P_avg - T)
        // Q_add = Q_cur * (P_avg - T) / (T - P_cur)

        // Check for impossible cases
        // If Target Price is between Current Price and Avg Price, it operates correctly.
        // If Target is not between them, you can't reach it by averaging (unless buying at negative price etc).

        // However, usually "Watering Down" means Price dropped, and we want to lower Avg to Target.
        // So Current < Target < Avg.
        // Or "Watering Up" (Pyramiding): Current > Target > Avg.

        // Denominator (targetAvgPrice - currentPrice)
        const denominator = targetAvgPrice - currentPrice;

        if (Math.abs(denominator) < 1e-9) {
            // Target == Current. Impossible to shift avg by buying at same price unless current already equals target.
            return { statusCode: 400, body: JSON.stringify({ error: "Target price cannot be equal to current price for averaging." }) };
        }

        const numerator = currentQuantity * (avgPrice - targetAvgPrice);
        let additionalQuantity = numerator / denominator;

        // specific validation
        if (additionalQuantity < 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Target price is not achievable with current price." }) };
        }

        additionalQuantity = Math.ceil(additionalQuantity);

        const currentTotalAmount = avgPrice * currentQuantity;
        const additionalAmount = currentPrice * additionalQuantity;
        const newTotalQuantity = currentQuantity + additionalQuantity;
        const newTotalAmount = currentTotalAmount + additionalAmount;
        const newAvgPrice = newTotalAmount / newTotalQuantity;

        const priceDiff = Math.abs(newAvgPrice - targetAvgPrice);
        const isAccurate = priceDiff < 1;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                additionalQuantity,
                additionalAmount,
                newTotalQuantity,
                newTotalAmount,
                newAvgPrice,
                targetAvgPrice,
                isAccurate,
                priceDiff
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
