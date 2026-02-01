exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const salePrice = parseFloat(String(data.salePrice).replace(/,/g, ''));
        const purchasePrice = parseFloat(String(data.purchasePrice).replace(/,/g, ''));
        const expenses = parseFloat(String(data.expenses).replace(/,/g, '')) || 0;
        const basicDeduction = parseFloat(String(data.basicDeduction).replace(/,/g, '')) || 0;
        const holdingYears = parseInt(data.holdingYears, 10) || 0;

        if (isNaN(salePrice) || isNaN(purchasePrice) || salePrice <= 0 || purchasePrice < 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const grossGain = salePrice - purchasePrice - expenses;
        const gainAfterDeduction = grossGain - basicDeduction;
        const taxableGainBeforeLT = Math.max(0, gainAfterDeduction);

        let longTermRate = 0;
        if (holdingYears >= 3) {
            longTermRate = Math.min((holdingYears - 2) * 2, 30); // 3+ years: 2% per year, max 30%
        }
        const longTermDeduction = taxableGainBeforeLT * (longTermRate / 100);
        const taxableIncome = Math.max(0, taxableGainBeforeLT - longTermDeduction);

        // 2024 Tax Brackets (assumed from frontend code)
        const taxBrackets = [
            { limit: 12000000, rate: 0.06, deduction: 0 },
            { limit: 46000000, rate: 0.15, deduction: 1080000 },
            { limit: 88000000, rate: 0.24, deduction: 5220000 },
            { limit: 150000000, rate: 0.35, deduction: 14900000 },
            { limit: 300000000, rate: 0.38, deduction: 19400000 },
            { limit: 500000000, rate: 0.40, deduction: 25400000 },
            { limit: 1000000000, rate: 0.42, deduction: 35400000 },
            { limit: Infinity, rate: 0.45, deduction: 65400000 }
        ];

        let baseTax = 0;
        for (const bracket of taxBrackets) {
            if (taxableIncome <= bracket.limit) {
                baseTax = taxableIncome * bracket.rate - bracket.deduction;
                break;
            }
        }
        baseTax = Math.max(0, baseTax);
        const localTax = baseTax * 0.1;
        const totalTax = baseTax + localTax;
        const netAfterTax = Math.max(0, grossGain - totalTax);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                salePrice,
                purchasePrice,
                expenses,
                grossGain,
                taxableGainBeforeLT,
                longTermDeduction,
                longTermRate,
                taxableIncome,
                baseTax,
                localTax,
                totalTax,
                netAfterTax
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
