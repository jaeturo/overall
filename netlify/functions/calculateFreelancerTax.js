exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const amount = parseFloat(String(data.amount).replace(/,/g, ''));
        const type = data.type; // 'contract' or 'received'

        if (isNaN(amount) || amount < 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        let contractAmount = 0;
        let baseTax = 0;
        let localTax = 0;
        let receivedAmount = 0;

        if (type === 'contract') {
            contractAmount = amount;
            baseTax = Math.round(contractAmount * 0.03);
            localTax = Math.round(contractAmount * 0.003);
            const totalTax = baseTax + localTax;
            receivedAmount = Math.max(0, Math.floor(contractAmount - totalTax));
        } else {
            // received
            receivedAmount = amount;
            contractAmount = amount > 0 ? Math.round(amount / (1 - 0.033)) : 0;
            baseTax = Math.round(contractAmount * 0.03);
            localTax = Math.round(contractAmount * 0.003);
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contractAmount,
                baseTax,
                localTax,
                totalTax: baseTax + localTax,
                receivedAmount
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
