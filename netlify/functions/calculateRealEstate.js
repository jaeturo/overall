exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const jeonseAmount = parseFloat(String(data.jeonseAmount || 0).replace(/,/g, ''));
        const monthlyRent = parseFloat(String(data.monthlyRent || 0).replace(/,/g, ''));
        const interestRate = parseFloat(data.interestRate);
        const type = data.type; // 'jeonse' (to wolse) or 'wolse' (to jeonse)

        if (isNaN(interestRate) || interestRate <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Interest Rate" }) };
        }

        const monthlyRate = interestRate / 100 / 12;
        let result = {};

        if (type === 'jeonse') {
            // Jeonse -> Wolse
            // Wolse = Jeonse * MonthlyRate
            if (jeonseAmount <= 0) return { statusCode: 400, body: JSON.stringify({ error: "Invalid Jeonse Amount" }) };

            const calculatedMonthlyRent = Math.round(jeonseAmount * monthlyRate);
            const yearlyRent = calculatedMonthlyRent * 12;

            result = {
                inputAmount: jeonseAmount,
                calculatedAmount: calculatedMonthlyRent,
                yearlyCost: yearlyRent,
                type: 'jeonse'
            };
        } else {
            // Wolse -> Jeonse
            // Jeonse = Wolse / MonthlyRate
            if (monthlyRent <= 0) return { statusCode: 400, body: JSON.stringify({ error: "Invalid Monthly Rent" }) };

            const calculatedJeonseAmount = Math.round(monthlyRent / monthlyRate);
            const yearlyRent = monthlyRent * 12; // Yearly cost of the rent

            result = {
                inputAmount: monthlyRent,
                calculatedAmount: calculatedJeonseAmount,
                yearlyCost: yearlyRent,
                type: 'wolse'
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
