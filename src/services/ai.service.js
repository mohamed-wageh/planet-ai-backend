const CNN_URL =
  'https://abdulrhmanHelmy-plantvillage-disease-detectorr.hf.space/predict';
const LLM_URL =
  'https://abdulrhmanhelmy-llm-grok.hf.space/query';

/**
 * Call the CNN plant-disease-detection endpoint.
 * @param {Buffer} imageBuffer - The raw image bytes
 * @param {string} filename - Original filename (e.g. "leaf.jpg")
 * @returns {Promise<object>} Parsed JSON response from the CNN model
 */
const detectDisease = async (imageBuffer, filename) => {
  // Use the native FormData + Blob (Node 18+) so it works with native fetch.
  // The npm 'form-data' package is NOT compatible with native fetch.
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  const form = new FormData();
  form.append('file', blob, filename);

  const response = await fetch(`${CNN_URL}?top_k=1`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CNN service error (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * Call the LLM plant Q&A endpoint.
 * @param {string} question - The user's question
 * @param {Array} history - Prior conversation turns [{role, content}, ...]
 * @returns {Promise<object>} Parsed JSON response from the LLM
 */
const askLLM = async (question, history = []) => {
  const response = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      top_k: 3,
      history,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM service error (${response.status}): ${errorText}`);
  }

  return response.json();
};

module.exports = {
  detectDisease,
  askLLM,
};
