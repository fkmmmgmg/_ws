const apiKey = "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"; // 替换为你的 API 密钥
const url = "https://api.groq.com/openai/v1/chat/completions"; // Groq API 端点

// 定義一個函式用來調用 API 並返回結果
export const askGroqAI = async (question) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // 模型名称
        messages: [{ role: "user", content: question }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }

    const data = await response.json();

    // 提取回答內容
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error("Invalid API response structure");
    }
  } catch (error) {
    console.error("API 请求失败：", error);
    throw error; // 將錯誤傳遞給調用方處理
  }
};
