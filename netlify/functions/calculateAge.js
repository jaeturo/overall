exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const birthYear = parseInt(data.birthYear, 10);
        const birthMonth = parseInt(data.birthMonth, 10);
        const birthDay = parseInt(data.birthDay, 10);
        const currentDateStr = data.currentDate;

        if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        const currentDate = currentDateStr ? new Date(currentDateStr) : new Date();
        const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

        // Korean Age (Man Age)
        let koreanAge = currentDate.getFullYear() - birthYear;
        if (currentDate.getMonth() < birthMonth - 1 ||
            (currentDate.getMonth() === birthMonth - 1 && currentDate.getDate() < birthDay)) {
            koreanAge--;
        }

        // Counting Age (Se-neun Age)
        const countingAge = currentDate.getFullYear() - birthYear + 1;

        // Year Age (Yeon Age)
        const yearAge = currentDate.getFullYear() - birthYear;

        // Days until next birthday
        const nextBirthday = new Date(currentDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (nextBirthday <= currentDate) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        const diffTime = nextBirthday - currentDate;
        const daysUntilBirthday = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        // nextBirthday string
        const nextBirthdayStr = `${nextBirthday.getMonth() + 1}월 ${nextBirthday.getDate()}일`;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                koreanAge,
                countingAge,
                yearAge,
                daysUntilBirthday,
                nextBirthdayStr,
                birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
                currentDate: currentDate.toISOString().split('T')[0]
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
