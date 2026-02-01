// solarlunar logic embedded
const lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
];

const solarMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function lYearDays(y) {
    var i, sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) {
        sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return sum + leapDays(y);
}

function leapDays(y) {
    if (leapMonth(y)) {
        return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
}

function leapMonth(y) {
    return lunarInfo[y - 1900] & 0xf;
}

function monthDays(y, m) {
    return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

function solar2lunar(y, m, d) {
    var dayCyl, monCyl, leap, isLeap, lDay, lMonth, lYear;
    var offset = Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31);
    offset /= 86400000;
    dayCyl = offset + 40;
    monCyl = 14;
    var i, temp = 0;
    for (i = 1900; i < 2050 && offset > 0; i++) {
        temp = lYearDays(i);
        offset -= temp;
    }
    if (offset < 0) {
        offset += temp;
        i--;
        monCyl -= 12;
    }
    lYear = i;
    leap = leapMonth(i);
    isLeap = false;
    for (i = 1; i < 13 && offset > 0; i++) {
        if (leap > 0 && i === (leap + 1) && isLeap === false) {
            --i;
            isLeap = true;
            temp = leapDays(lYear);
        } else {
            temp = monthDays(lYear, i);
        }
        if (isLeap && i === (leap + 1)) {
            isLeap = false;
        }
        offset -= temp;
        if (!isLeap) {
            monCyl++;
        }
    }
    if (offset === 0 && leap > 0 && i === leap + 1) {
        if (isLeap) {
            isLeap = false;
        } else {
            isLeap = true;
            --i;
            --monCyl;
        }
    }
    if (offset < 0) {
        offset += temp;
        --i;
        --monCyl;
    }
    lMonth = i;
    lDay = offset + 1;
    return {
        lunarYear: lYear,
        lunarMonth: lMonth,
        lunarDay: lDay,
        isLeap: isLeap
    };
}

function lunar2solar(y, m, d, isLeapMonth) {
    var i, leap, temp = 0;
    var offset = 0;
    for (i = 1900; i < y; i++) {
        offset += lYearDays(i);
    }
    leap = leapMonth(y);
    for (i = 1; i < m; i++) {
        temp = monthDays(y, i);
        offset += temp;
    }
    if (leap !== 0 && m > leap) {
        offset += leapDays(y);
        if (isLeapMonth && m === (leap + 1)) {
            offset -= monthDays(y, m);
        }
    } else if (isLeapMonth && m === (leap + 1)) {
        offset += monthDays(y, m);
    }
    offset += d - 31;
    var solarDate = new Date(Date.UTC(1900, 0, 31));
    solarDate.setUTCDate(solarDate.getUTCDate() + offset);
    return {
        solarYear: solarDate.getUTCFullYear(),
        solarMonth: solarDate.getUTCMonth() + 1,
        solarDay: solarDate.getUTCDate()
    };
}

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const { type, year, month, day, isLeap } = data;
        // type: 'solar2lunar' or 'lunar2solar'

        let result;
        if (type === 'solar2lunar') {
            result = solar2lunar(year, month, day);
        } else if (type === 'lunar2solar') {
            result = lunar2solar(year, month, day, isLeap);
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Type" }) };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result)
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error", details: error.toString() }) };
    }
};
