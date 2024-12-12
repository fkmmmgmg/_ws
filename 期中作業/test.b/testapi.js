const apiKey = "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"; // 替换为你的 API 密钥
const url = "https://api.groq.com/openai/v1/chat/completions"; // Groq API 端点

// 使用 Deno 的标准库来处理输入
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const askQuestion = async (question) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // 模型名称
        messages: [{ role: "user", content: question }], // 根据 API 文档使用 messages 数组来传递问题
        max_tokens: 150, // 根据需求设置返回文本的长度
        temperature: 0.7, // 调整生成文本的随机性
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
    }

    const data = await response.json();
    console.log("完整响应数据：", data); // 打印完整的 API 响应

    // 检查响应结构并输出回答
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      console.log("回答：", data.choices[0].message.content.trim()); // 处理返回的答案
    } else {
      console.error("返回的数据结构不正确");
    }
  } catch (error) {
    console.error("API 请求失败：", error);
  }
};

const main = async () => {
  // 使用 Deno 提供的 `prompt` 函数获取输入
  const question = prompt("请输入您的问题：");
  if (question) {
    await askQuestion(question);
  } else {
    console.log("未输入问题，程序结束");
  }
};

main();
