export const parseGeminiJson = (response, emptyMessage, invalidMessage) => {
  const outputText = response.text;

  if (!outputText) {
    const error = new Error(emptyMessage);
    error.statusCode = 502;
    throw error;
  }

  try {
    return JSON.parse(outputText);
  } catch {
    const error = new Error(invalidMessage);
    error.statusCode = 502;
    throw error;
  }
};
