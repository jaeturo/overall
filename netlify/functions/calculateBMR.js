exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const gender = data.gender;
        const weight = parseFloat(data.weight);
        const height = parseFloat(data.height);
        const age = parseInt(data.age, 10);

        if (!gender || isNaN(weight) || isNaN(height) || isNaN(age)) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid Input" }) };
        }

        // Mifflin-St Jeor Formula
        const base = 10 * weight + 6.25 * height - 5 * age;
        const bmr = gender === 'male' ? base + 5 : base - 161;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bmr,
                gender
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
