exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);

        // Parse inputs
        const principal = parseFloat(String(data.principal).replace(/,/g, ''));
        const annualRatePct = parseFloat(data.rate);
        const years = parseInt(data.years, 10);
        const monthlyContribution = parseFloat(String(data.monthly || 0).replace(/,/g, ''));
        const taxPct = parseFloat(data.tax || 0);
        const compFreq = data.frequency || 'month';
        const currency = data.currency || 'KRW';
        const fxRate = parseFloat(data.fxRate) || 1350;

        // Validate
        if (isNaN(principal) || isNaN(years) || isNaN(annualRatePct) || principal < 0 || years < 1 || annualRatePct < 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid input values" }) };
        }

        // Calculation Logic (Hidden from client)
        const rNom = Math.max(0, annualRatePct) / 100;
        const t = Math.max(0, taxPct) / 100;
        const P = Math.max(0, principal);
        const PMT = Math.max(0, monthlyContribution);

        const nMap = { year: 1, month: 12, week: 52, day: 365 };
        const n = nMap[compFreq] || 12; // Default to monthly if invalid

        const totalPeriods = Math.round(n * years);
        const i_n = rNom / n; // Rate per compounding period

        // For monthly contribution logic:
        // If compounding is NOT monthly, this gets complex. 
        // Simplified assumption for the web tool: 
        // If 'PMT' is monthly contribution, we convert it to match the compounding frequency approx or standard formula.
        // However, the original frontend code assumed PMT is added MONTHLY regardless of compounding frequency?
        // Let's look at the original logic: "i_m = Math.pow(1+i_n, n/12)-1" -> Converts compounding rate to monthly effective rate
        // Then uses standard annuity formula. We will replicate that exact logic.

        const i_m = Math.pow(1 + i_n, n / 12) - 1;
        // i_m is the effective monthly rate derived from the nominal rate compounded 'n' times a year.

        // Final Value of Principal
        const FV_P = P * Math.pow(1 + i_n, totalPeriods);

        // Final Value of Contributions (Annuity)
        // PMT is deposited at BEGINNING of month? Original code: 
        // FV_C = PMT * ( (1+i_m)^months - 1 ) / i_m  <-- End of period?
        // Let's check original source in Step 36.
        // Original: FV_C = PMT * ((Math.pow(1+i_m, monthlyPeriods)-1)/i_m)
        // This is Ordinary Annuity (End of period).

        const monthlyPeriods = 12 * years;
        let FV_C = 0;
        if (PMT > 0) {
            if (Math.abs(i_m) < 1e-12) {
                FV_C = PMT * monthlyPeriods;
            } else {
                FV_C = PMT * ((Math.pow(1 + i_m, monthlyPeriods) - 1) / i_m);
            }
        }

        const FV_gross = FV_P + FV_C;
        const paid = P + (PMT * monthlyPeriods);
        const interest = Math.max(0, FV_gross - paid);

        // Tax Calculation (Simple EOP tax assumption for summary, usually)
        // Original code had a 'TAX_MODE' but usually displayed EOP or Monthly.
        // Let's stick to the Simple Summary logic: Tax on total interest.
        const taxAmt = interest * t;
        const net = FV_gross - taxAmt;

        // Formatting helpers
        const _fmt = (v) => Math.round(v).toLocaleString('ko-KR');

        // Generate Year-by-Year Table Data (Cap at 1000 rows as per rules)
        // We can return the full table data or just summary. 
        // The frontend draws a table. It's better to return the table data JSON so frontend just renders it.

        const tableData = [];
        let prevInterestGross = 0;
        let prevInterestNet = 0;

        // Limit loop to prevent timeouts
        const maxRows = 1000;
        const loopLimit = Math.min(totalPeriods, maxRows);

        const base_m = 1 + i_m;

        for (let period = 1; period <= loopLimit; period++) {
            const yearsElapsed = period / n;
            const totalMonths = 12 * yearsElapsed;

            // Contributions so far (Simple approx for table alignment)
            const paymentsCount = (PMT > 0 && totalMonths > 0) ? Math.ceil(totalMonths - 1e-9) : 0;

            const rowFV_P = P * Math.pow(1 + i_n, period);
            let rowFV_C = 0;

            if (PMT > 0 && paymentsCount > 0) {
                if (Math.abs(i_m) < 1e-12) {
                    rowFV_C = PMT * paymentsCount;
                } else {
                    // Annuity 
                    const powTotal = Math.pow(base_m, totalMonths); // Equivalent to (1+i_m)^totalMonths
                    // Standard FV of ordinary annuity: PMT * ( (1+r)^n - 1 ) / r
                    // But we need to align exactly with totalMonths floating point?
                    // Original code: const decay = Math.pow(base_m, -payments); FV_C = monthly * powTotal * base_m * (1 - decay) / i_m;
                    // We trust the original logic's intent. Let's simplify for robustness if needed, but copying original logic ensures consistency.
                    const decay = Math.pow(base_m, -paymentsCount);
                    rowFV_C = PMT * powTotal * base_m * (1 - decay) / i_m;
                }
            }

            const rowFV_Gross = rowFV_P + rowFV_C;
            const rowPaid = P + (PMT * paymentsCount);
            const rowInterest = Math.max(0, rowFV_Gross - rowPaid);
            const rowTax = rowInterest * t;
            const rowNet = rowFV_Gross - rowTax;

            const rowNetInterest = Math.max(0, rowInterest - rowTax);

            const periodInterestGross = rowInterest - prevInterestGross;
            const periodInterestNet = rowNetInterest - prevInterestNet;

            // Yield
            const baseForYield = (t > 0) ? rowNet : rowFV_Gross;
            const yieldPct = (P > 0) ? ((baseForYield - rowPaid) / P) * 100 : 0; // Using P as yield base? Or Paid? Original used Paid? 
            // Original: ((cumulativeRateBase - paidSoFar) / principal) * 100.
            const rowYield = (P > 0) ? ((baseForYield - rowPaid) / P) * 100 : 0;

            tableData.push({
                id: period,
                periodInterest: Math.round(periodInterestGross),
                periodInterestNet: Math.round(periodInterestNet),
                totalInterest: Math.round(rowInterest),
                totalInterestNet: Math.round(rowNetInterest),
                totalAmount: Math.round(rowFV_Gross),
                totalAmountNet: Math.round(rowNet),
                yield: rowYield.toFixed(2)
            });

            prevInterestGross = rowInterest;
            prevInterestNet = rowNetInterest;
        }

        // Return everything needed
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                summary: {
                    finalAmount: Math.round(FV_gross),
                    finalAmountNet: Math.round(net),
                    totalPaid: Math.round(paid),
                    totalInterest: Math.round(interest),
                    totalInterestNet: Math.round(interest - taxAmt),
                    currency: currency,
                    fxRate: fxRate
                },
                table: tableData
            })
        };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: "Calculation Failed" }) };
    }
};
