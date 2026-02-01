exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const heightCm = parseFloat(data.heightCm);
    const weightKg = parseFloat(data.weightKg);

    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid input" })
      };
    }

    // Logic moved from frontend
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    
    // Determine category
    let category = "고도비만";
    let message = "의료진과 상의하여 체계적인 치료 계획을 세워야 합니다.";

    if (bmi < 18.5) {
      category = "저체중";
      message = "체중 증가와 균형 잡힌 영양 섭취가 필요합니다.";
    } else if (bmi < 23.0) {
      category = "정상";
      message = "현재 상태를 유지하며 규칙적인 운동을 지속하세요.";
    } else if (bmi < 25.0) {
      category = "과체중";
      message = "가벼운 운동과 식단 조절로 체중 관리를 시작해 보세요.";
    } else if (bmi < 30.0) {
      category = "비만(1단계)";
      message = "체중 감량을 위한 꾸준한 운동과 식이요법이 필요합니다.";
    } else if (bmi < 35.0) {
      category = "비만(2단계)";
      message = "전문의 상담과 집중적인 체중 관리가 권장됩니다.";
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bmi: bmi.toFixed(1),
        category: category,
        message: message
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error" })
    };
  }
};
