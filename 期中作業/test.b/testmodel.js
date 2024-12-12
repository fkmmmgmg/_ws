const apiKey = "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"; // 替換為你的 API 金鑰
const url = "https://api.groq.com/openai/v1/models";

const listModels = async () => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("模型列表：", data);
  } catch (error) {
    console.error("API 請求失敗：", error);
  }
};

listModels();
