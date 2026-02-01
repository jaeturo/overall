exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const totalExpectedProfit = parseFloat(String(data.totalExpectedProfit).replace(/,/g, ''));
        const deductionYears = parseInt(String(data.deductionYears).replace(/,/g, ''), 10);

        if (isNaN(totalExpectedProfit) || isNaN(deductionYears) || totalExpectedProfit <= 0 || deductionYears <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const annualDeduction = 2500000;
        const taxRate = 0.22;

        // Strategy 1: Annual Deduction
        const totalDeductionAmount = annualDeduction * deductionYears;
        const annualStrategyTaxableIncome = Math.max(0, totalExpectedProfit - totalDeductionAmount);
        const annualStrategyTax = annualStrategyTaxableIncome * taxRate;
        const annualStrategyNet = totalExpectedProfit - annualStrategyTax;

        // Strategy 2: No Deduction (One-time)
        const noDeductionStrategyTaxableIncome = Math.max(0, totalExpectedProfit - annualDeduction);
        const noDeductionStrategyTax = noDeductionStrategyTaxableIncome * taxRate;
        const noDeductionStrategyNet = totalExpectedProfit - noDeductionStrategyTax;

        const taxDifference = noDeductionStrategyTax - annualStrategyTax;

        // Yearly Breakdown Generation
        const yearlyBreakdown = [];
        for (let year = 1; year <= deductionYears; year++) {
            const cumulativeDeduction = annualDeduction * year;
            const taxableIncome = Math.max(0, totalExpectedProfit - cumulativeDeduction);
            const tax = taxableIncome * taxRate;
            const netProfit = totalExpectedProfit - tax;
            const diffAmount = netProfit - noDeductionStrategyNet;

            yearlyBreakdown.push({
                year,
                cumulativeDeduction,
                netProfit,
                diffAmount
            });
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                totalExpectedProfit,
                annualDeduction,
                deductionYears,
                annualStrategy: {
                    totalDeductionAmount,
                    taxableIncome: annualStrategyTaxableIncome,
                    tax: annualStrategyTax,
                    netProfit: annualStrategyNet
                },
                noDeductionStrategy: {
                    taxableIncome: noDeductionStrategyTaxableIncome,
                    tax: noDeductionStrategyTax,
                    netProfit: noDeductionStrategyNet
                },
                taxDifference,
                yearlyBreakdown
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
