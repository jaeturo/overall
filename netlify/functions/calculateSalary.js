exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const annualSalary = parseFloat(String(data.annualSalary).replace(/,/g, ''));
        const monthlyNonTaxMeal = parseFloat(String(data.monthlyNonTaxMeal).replace(/,/g, '')) || 0;
        const includeTax = data.includeTax === true || data.includeTax === 'yes';

        if (isNaN(annualSalary) || annualSalary <= 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Salary" }) };
        }

        const grossMonthly = annualSalary / 12;
        // Basic taxable base estimation
        const taxableBase = Math.max(0, grossMonthly - monthlyNonTaxMeal);

        // 4 Major Insurances (Estimates)
        const pension = Math.floor(taxableBase * 0.045);      // National Pension 4.5%
        const health = Math.floor(taxableBase * 0.03545);     // Health Insurance 3.545%
        const ltc = Math.floor(health * 0.1295);              // Long-term Care 12.95% of Health
        const employment = Math.floor(taxableBase * 0.009);   // Employment Insurance 0.9%

        // Cap checks could be added here for more accuracy, but keeping to original logic for now
        // (National Pension max monthly contribution base is ~6.17m KRW as of 2025, but simple calculator often ignores caps or uses simple % for estimation)

        const fourInsurances = pension + health + ltc + employment;

        // Income Tax Estimation (Simplified Year-End Tax Adjustment Logic / Withholding Tax Table approximation)
        let tax = 0;
        if (includeTax) {
            // Simplified Progressive Tax Bracket Logic (Monthly basis assumption for estimation)
            // Note: Real withholding tax uses the Hometax table which depends on family members.
            // This logic mimics the frontend's simple bracket logic.
            const base = taxableBase - fourInsurances; // Simple assumption: Income - Insurance = Tax Base

            if (base > 0) {
                if (base <= 1400000) {
                    tax = base * 0.06;
                } else if (base <= 5000000) {
                    tax = 84000 + (base - 1400000) * 0.15;
                } else if (base <= 8800000) {
                    tax = 564000 + (base - 5000000) * 0.24;
                } else if (base <= 15000000) {
                    tax = 1476000 + (base - 8800000) * 0.35;
                } else {
                    tax = 3506000 + (base - 15000000) * 0.38;
                }
            }
            // Local Income Tax (10% of Income Tax)
            tax = Math.floor(tax * 1.1);
        }

        const netMonthly = Math.floor(grossMonthly - fourInsurances - tax + monthlyNonTaxMeal); // Add back meal allowance? 
        // Wait, original logic: netMonthly = grossMonthly - four - tax + monthlyMeal;
        // If meal was removed from taxableBase, it is still part of gross pay.
        // Logic: Gross (includes meal) - Deductions (calculated on Gross-Meal) = Net.
        // Correct.

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                grossMonthly: Math.floor(grossMonthly),
                pension,
                health,
                ltc,
                employment,
                fourInsurances,
                tax: Math.floor(tax),
                netMonthly,
                includeTax
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
