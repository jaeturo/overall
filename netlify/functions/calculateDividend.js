exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const stockPrice = parseFloat(String(data.stockPrice).replace(/,/g, ''));
        const dividend = parseFloat(String(data.dividend).replace(/,/g, ''));
        const taxRateInput = parseFloat(data.taxRate);

        if (isNaN(stockPrice) || isNaN(dividend) || stockPrice <= 0 || dividend < 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const taxRate = !isNaN(taxRateInput) ? taxRateInput / 100 : 0;

        const yieldBeforeTax = (dividend / stockPrice) * 100;
        const dividendAfterTax = taxRate > 0 ? dividend * (1 - taxRate) : dividend;
        const yieldAfterTax = (dividendAfterTax / stockPrice) * 100;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                yieldBeforeTax,
                yieldAfterTax,
                dividend,
                dividendAfterTax,
                taxRate
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
