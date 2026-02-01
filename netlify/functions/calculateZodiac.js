exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const birthYear = parseInt(data.birthYear, 10);

        if (isNaN(birthYear)) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const zodiacs = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
        const chineseChars = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

        // 1993(Rooster) -> Index 9
        // (1993 - 1900) % 12 = 93 % 12 = 9. So (year - 1900) % 12 gives index if we align 0 to Rat (1900 is Rat).
        // Let's verify 1900 is Rat (Ja).
        // 2024 is Dragon (Jin). (2024 - 1900) % 12 = 124 % 12 = 4. 0=Rat, 1=Ox, 2=Tiger, 3=Rabbit, 4=Dragon. Correct.
        // So logic is (year - 4) % 12. 
        // Wait, let's stick to the frontend logic to be safe or use the standard offset.
        // Frontend logic:
        // baseYear = 1993 (Rooster, index 9)
        // yearDiff = year - 1993
        // index = (9 + diff) % 12

        // Standard: (year - 4) % 12. 
        // 1900 - 4 = 1896. 1896 % 12 = 0 (Rat).
        // 1993 - 4 = 1989. 1989 % 12 = 9 (Rooster). Match.

        const offset = (birthYear - 4) % 12;
        // Javascript modulo of negative numbers is negative.
        const finalIndex = offset < 0 ? offset + 12 : offset;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                zodiac: zodiacs[finalIndex],
                chineseChar: chineseChars[finalIndex],
                order: finalIndex + 1,
                birthYear
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
