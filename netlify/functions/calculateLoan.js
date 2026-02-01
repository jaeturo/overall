exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const principal = parseFloat(String(data.principal).replace(/,/g, ''));
        const rate = parseFloat(data.rate);
        const years = parseInt(data.years, 10);
        const periodType = data.periodType || 'year'; // year or month
        const type = data.type || 'equal'; // equal (Amortization) or principal (Constant Principal)

        if (isNaN(principal) || isNaN(rate) || isNaN(years) || principal <= 0 || years < 1) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const totalMonths = periodType === 'year' ? years * 12 : years;
        const monthlyRate = rate / 100 / 12;

        let schedule = [];
        let summary = {};

        if (type === 'equal') {
            // Equal Principle and Interest Payment (Amortization)
            // Formula: PMT = P * r * (1+r)^n / ((1+r)^n - 1)
            const commonPow = Math.pow(1 + monthlyRate, totalMonths);
            const monthlyPayment = principal * (monthlyRate * commonPow) / (commonPow - 1);

            let remainingPrincipal = principal;
            let totalPayment = 0;
            let totalInterest = 0;

            for (let i = 1; i <= totalMonths; i++) {
                const interest = remainingPrincipal * monthlyRate;
                let principalPayment = monthlyPayment - interest;

                // Adjust last month for rounding errors
                if (i === totalMonths) {
                    principalPayment = remainingPrincipal;
                    // monthlyPayment might slightly vary in last month strictly speaking, but standard formula keeps PMT constant. 
                    // We'll stick to standard calc.
                }

                remainingPrincipal -= principalPayment;
                if (remainingPrincipal < 0) remainingPrincipal = 0; // Floating point safety

                totalPayment += (principalPayment + interest);
                totalInterest += interest;

                if (i <= 360) { // Limit rows returned for performance, though full schedule is requested
                    schedule.push({
                        round: i,
                        payment: Math.round(principalPayment + interest),
                        principalPayment: Math.round(principalPayment),
                        interest: Math.round(interest),
                        remainingPrincipal: Math.round(remainingPrincipal)
                    });
                }
            }
            summary = {
                monthlyPayment: Math.round(monthlyPayment),
                totalPayment: Math.round(totalPayment),
                totalInterest: Math.round(totalInterest)
            };

        } else {
            // Constant Principal Repayment
            const principalPayment = principal / totalMonths;
            let remainingPrincipal = principal;
            let totalPayment = 0;
            let totalInterest = 0;

            for (let i = 1; i <= totalMonths; i++) {
                const interest = remainingPrincipal * monthlyRate;
                const monthlyTotal = principalPayment + interest;

                remainingPrincipal -= principalPayment;
                if (remainingPrincipal < 0) remainingPrincipal = 0;

                totalPayment += monthlyTotal;
                totalInterest += interest;

                if (i <= 360) {
                    schedule.push({
                        round: i,
                        payment: Math.round(monthlyTotal),
                        principalPayment: Math.round(principalPayment),
                        interest: Math.round(interest),
                        remainingPrincipal: Math.round(remainingPrincipal)
                    });
                }
            }
            summary = {
                monthlyPayment: Math.round(principalPayment), // Showing principal part as base
                totalPayment: Math.round(totalPayment),
                totalInterest: Math.round(totalInterest)
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                summary,
                schedule, // Cap at first 360 months (30 years) to avoid payload limits if needed, or paginate. 
                // For now sending up to 30 years is fine (~100KB JSON).
                type
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
