exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const faceValue = parseFloat(String(data.faceValue).replace(/,/g, ''));
        const couponRate = parseFloat(data.couponRate);
        const purchasePrice = parseFloat(String(data.purchasePrice).replace(/,/g, ''));
        const years = parseFloat(data.yearsToMaturity);
        const frequency = parseInt(data.paymentFrequency, 10);
        const taxRateInput = parseFloat(data.taxRate);

        if (isNaN(faceValue) || isNaN(couponRate) || isNaN(purchasePrice) || isNaN(years) || isNaN(frequency) ||
            faceValue <= 0 || purchasePrice <= 0 || years <= 0 || couponRate < 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const taxRate = !isNaN(taxRateInput) ? taxRateInput : 0; // Keep as percentage for now or convert? Logic uses /100 later

        // YTM Calculation Logic
        const computeYTM = (faceValue, couponRate, price, years, frequency) => {
            const coupon = faceValue * (couponRate / 100) / frequency;
            const periods = Math.round(years * frequency);
            if (periods <= 0) return 0;
            const isZeroCoupon = coupon === 0;

            let low = 0;
            let high = 1;

            const priceFromYield = (yieldRate) => {
                const periodYield = yieldRate / frequency;
                let pv = 0;
                if (!isZeroCoupon) {
                    for (let i = 1; i <= periods; i++) {
                        pv += coupon / Math.pow(1 + periodYield, i);
                    }
                }
                pv += faceValue / Math.pow(1 + periodYield, periods);
                return pv;
            };

            if (price <= 0) return 0;

            while (priceFromYield(high) > price && high < 10) {
                high *= 2;
            }

            for (let i = 0; i < 60; i++) {
                const mid = (low + high) / 2;
                const pv = priceFromYield(mid);
                if (Math.abs(pv - price) < 1e-3) {
                    return mid * 100;
                }
                if (pv > price) {
                    low = mid;
                } else {
                    high = mid;
                }
            }
            return ((low + high) / 2) * 100;
        };

        const couponPerPeriod = faceValue * (couponRate / 100) / frequency;
        const annualCoupon = couponPerPeriod * frequency;
        const currentYield = purchasePrice > 0 ? (annualCoupon / purchasePrice) * 100 : 0;
        const ytm = computeYTM(faceValue, couponRate, purchasePrice, years, frequency);
        const periods = Math.round(years * frequency);
        const taxMultiplier = (1 - taxRate / 100);

        // Generate Cashflow Schedule
        let cumulativeCashflow = -purchasePrice;
        const schedule = [];

        for (let i = 1; i <= periods; i++) {
            const couponAfterTax = couponPerPeriod * taxMultiplier;
            cumulativeCashflow += couponAfterTax;
            let couponDisplay = couponPerPeriod;
            let couponAfterTaxDisplay = couponAfterTax;
            if (i === periods) {
                cumulativeCashflow += faceValue;
            }
            schedule.push({
                period: i,
                coupon: Math.round(couponDisplay),
                couponAfterTax: Math.round(couponAfterTaxDisplay),
                cumulative: Math.round(cumulativeCashflow)
            });
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentYield,
                ytm,
                annualCoupon,
                totalCouponAfterTax: couponPerPeriod * taxMultiplier * periods,
                faceValue,
                schedule
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
