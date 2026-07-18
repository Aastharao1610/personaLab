const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const getAnalyzeUrl = () =>
  API_BASE_URL.endsWith('/api/v1')
    ? API_BASE_URL.replace(/\/api\/v1$/, '/analyze')
    : `${API_BASE_URL}/analyze`;

const getAnalyzeWebsiteUrl = () => `${getAnalyzeUrl()}/url`;

const parseJsonResponse = (request) => {
  let payload = {};

  try {
    payload = request.responseText ? JSON.parse(request.responseText) : {};
  } catch {
    payload = {};
  }

  if (request.status >= 200 && request.status < 300) {
    return payload;
  }

  throw new Error(payload.message || payload.error?.message || 'Request failed');
};

const getErrorMessage = (payload, fallback) => {
  const validationMessages = payload.validationErrors
    ? Object.entries(payload.validationErrors)
      .flatMap(([section, issues]) =>
        issues.map((issue) => `${section}.${issue.path}: ${issue.message}`))
      .join('; ')
    : '';

  return validationMessages || payload.message || payload.error?.message || fallback;
};

export const uploadImage = (file, onProgress) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', file);

    const request = new XMLHttpRequest();
    request.open('POST', getAnalyzeUrl());
    request.timeout = 120000;

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;

      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress(progress);
    };

    request.onload = async () => {
      try {
        const analysis = parseJsonResponse(request);
        onProgress?.(100);
        resolve(analysis);
      } catch (error) {
        reject(error);
      }
    };

    request.onerror = () => {
      reject(new Error('Unable to reach the upload service'));
    };

    request.ontimeout = () => {
      reject(new Error('Analysis timed out. The AI provider may be slow or rate limited.'));
    };

    request.onabort = () => {
      reject(new Error('Analysis was cancelled.'));
    };

    request.send(formData);
  });

export const analyzeWebsiteUrl = async (url) => {
  const response = await fetch(getAnalyzeWebsiteUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to capture and analyze the website'));
  }

  return payload;
};

export const generatePersonas = async (productUnderstanding) => {
  const response = await fetch(`${API_BASE_URL}/personas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productUnderstanding),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to generate personas'));
  }

  return payload;
};

export const runBehaviorSimulation = async ({ productUnderstanding, personas }) => {
  const response = await fetch(`${API_BASE_URL}/simulations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productUnderstanding,
      personas,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to run behavior simulation'));
  }

  return payload;
};

export const generateInsights = async ({ productUnderstanding, personas, simulation }) => {
  const response = await fetch(`${API_BASE_URL}/insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productUnderstanding,
      personas,
      simulation,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to generate insights'));
  }

  return payload;
};
