exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const totalSellAmount = parseFloat(String(data.totalSellAmount).replace(/,/g, ''));
        const totalPurchaseAmount = parseFloat(String(data.totalPurchaseAmount).replace(/,/g, ''));

        if (isNaN(totalSellAmount) || isNaN(totalPurchaseAmount) || totalSellAmount <= 0 || totalPurchaseAmount <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const capitalGain = totalSellAmount - totalPurchaseAmount;
        const deductionAmount = 2500000; // 2.5 million KRW deduction
        const taxableIncome = Math.max(0, capitalGain - deductionAmount);

        // 22% Tax Rate (20% Capital Gain + 2% Local)
        const capitalGainTax = taxableIncome * 0.20;
        const localTax = taxableIncome * 0.02;
        const totalTax = capitalGainTax + localTax;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                totalSellAmount,
                totalPurchaseAmount,
                capitalGain,
                deductionAmount,
                taxableIncome,
                capitalGainTax,
                localTax,
                totalTax
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
