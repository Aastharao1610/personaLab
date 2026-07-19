import {
  aiProvider,
  gemini,
  geminiFallbackModel,
  geminiModel,
  groqApiKey,
  groqFallbackModel,
  groqTextModel,
  groqVisionModel,
} from "../config/openai.js";
import { logger } from "../utils/logger.js";

const PROVIDER_NAME = aiProvider === "groq" ? "Groq" : "Gemini";
const PROVIDER_STAGE = "AI_PROVIDER";
const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404]);

export class AIProviderError extends Error {
  constructor({ errorType, message, statusCode = 503 }) {
    super(message);
    this.name = "AIProviderError";
    this.statusCode = statusCode;
    this.structuredError = {
      success: false,
      stage: PROVIDER_STAGE,
      errorType,
      message,
      provider: PROVIDER_NAME,
    };
  }
}

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getStatusCode = (error) =>
  Number(
    error?.status ||
      error?.statusCode ||
      error?.response?.status ||
      error?.cause?.status,
  );

const getErrorMessage = (error) =>
  String(error?.message || "AI provider request failed");

const isQuotaExhaustedError = (error) => {
  const message = getErrorMessage(error).toLowerCase();

  return (
    getStatusCode(error) === 429 &&
    (message.includes("quota exceeded") ||
      message.includes("resource_exhausted") ||
      message.includes("free_tier"))
  );
};

const isRetryableError = (error) =>
  RETRYABLE_STATUS_CODES.has(getStatusCode(error));

const isNonRetryableError = (error) =>
  NON_RETRYABLE_STATUS_CODES.has(getStatusCode(error));

const isModelUnavailableError = (error) => {
  const statusCode = getStatusCode(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    statusCode === 404 ||
    message.includes("model not found") ||
    message.includes("model is not found") ||
    message.includes("model unavailable") ||
    message.includes("model does not exist") ||
    message.includes("invalid model") ||
    message.includes("decommissioned") ||
    message.includes("not supported") ||
    message.includes("not available")
  );
};

const toErrorType = (error) => {
  if (isModelUnavailableError(error)) {
    return "MODEL_UNAVAILABLE";
  }

  const statusCode = getStatusCode(error);

  if (isQuotaExhaustedError(error)) {
    return "QUOTA_EXHAUSTED";
  }

  if (statusCode === 429) {
    return "RATE_LIMITED";
  }

  if (RETRYABLE_STATUS_CODES.has(statusCode)) {
    return "TRANSIENT_PROVIDER_ERROR";
  }

  if (statusCode === 401 || statusCode === 403) {
    return "AUTH_ERROR";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "BAD_PROVIDER_REQUEST";
  }

  return "PROVIDER_ERROR";
};

const toStatusCode = (error) => {
  const statusCode = getStatusCode(error);
  return statusCode >= 400 && statusCode < 600 ? statusCode : 503;
};

const createProviderError = (error, fallbackUsed) => {
  const errorType = toErrorType(error);
  const message = fallbackUsed
    ? `${PROVIDER_NAME} primary and fallback models failed: ${getErrorMessage(error)}`
    : getErrorMessage(error);

  return new AIProviderError({
    errorType,
    message,
    statusCode: toStatusCode(error),
  });
};

const hasInlineImageData = (request) =>
  request?.contents?.some((content) =>
    content?.parts?.some((part) => Boolean(part?.inlineData)),
  );

const getPrimaryModel = (request) => {
  if (aiProvider === "groq") {
    return hasInlineImageData(request) ? groqVisionModel : groqTextModel;
  }

  return geminiModel;
};

const getFallbackModel = () =>
  aiProvider === "groq" ? groqFallbackModel : geminiFallbackModel;

const isProviderConfigured = () => {
  if (aiProvider === "groq") {
    return Boolean(groqApiKey);
  }

  return Boolean(gemini);
};

const getNotConfiguredMessage = () => {
  if (aiProvider === "groq") {
    return "Groq API key is not configured";
  }

  return "Gemini API key is not configured";
};

const logFinalResult = ({
  context,
  model,
  success,
  fallbackUsed,
  startedAt,
  error,
}) => {
  logger.info("Final Result", {
    ...context,
    provider: PROVIDER_NAME,
    model,
    success,
    fallbackUsed,
    responseTimeMs: Date.now() - startedAt,
    errorType: error?.structuredError?.errorType,
  });
};

const toGroqRole = (role) => {
  if (role === "model") {
    return "assistant";
  }

  return role || "user";
};

const toGroqMessageContent = (parts = []) => {
  const hasImage = parts.some((part) => Boolean(part?.inlineData));

  if (!hasImage) {
    return parts
      .filter((part) => typeof part?.text === "string")
      .map((part) => part.text)
      .join("\n");
  }

  return parts
    .map((part) => {
      if (typeof part?.text === "string") {
        return {
          type: "text",
          text: part.text,
        };
      }

      if (part?.inlineData?.data && part?.inlineData?.mimeType) {
        return {
          type: "image_url",
          image_url: {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          },
        };
      }

      return null;
    })
    .filter(Boolean);
};

const toGroqMessages = (request) => {
  const messages = [];

  if (request?.config?.systemInstruction) {
    messages.push({
      role: "system",
      content: request.config.systemInstruction,
    });
  }

  for (const content of request?.contents || []) {
    messages.push({
      role: toGroqRole(content?.role),
      content: toGroqMessageContent(content?.parts),
    });
  }

  return messages;
};

const withSchemaInstruction = (messages, schema) => {
  if (!schema) {
    return messages;
  }

  return messages.map((message, index) => {
    if (
      index !== 0 ||
      message.role !== "system" ||
      typeof message.content !== "string"
    ) {
      return message;
    }

    return {
      ...message,
      content: [
        message.content,
        "Return a single JSON object that satisfies this JSON Schema exactly.",
        JSON.stringify(schema),
      ].join("\n"),
    };
  });
};

// const toGroqResponseFormat = (request, { relaxedSchema = false } = {}) => {
//   if (request?.config?.responseJsonSchema && !relaxedSchema) {
//     return {
//       type: "json_schema",
//       json_schema: {
//         name: "personalab_response",
//         schema: request.config.responseJsonSchema,
//         strict: true,
//       },
//     };
//   }

const toGroqResponseFormat = (request) => {
  if (request?.config?.responseMimeType === "application/json") {
    return {
      type: "json_object",
    };
  }

  return undefined;
};
  // if (
  //   request?.config?.responseMimeType === "application/json" ||
  //   relaxedSchema
  // ) {
  //   return {
  //     type: "json_object",
  //   };
  // }

  // return undefined;
// };

const toGroqRequestBody = (request, model, options = {}) => {
  const messages = toGroqMessages(request);
  const relaxedSchema =
    options.relaxedSchema ||
    request?.config?.groqResponseMode === "json_object";

  const body = {
    model,
    // messages: relaxedSchema
    //   ? withSchemaInstruction(messages, request?.config?.responseJsonSchema)
    //   : messages,

    messages: withSchemaInstruction(
      messages,
      request?.config?.responseJsonSchema,
    ),
  };

  if (typeof request?.config?.temperature === "number") {
    body.temperature = request.config.temperature;
  }

  if (typeof request?.config?.maxOutputTokens === "number") {
    body.max_tokens = request.config.maxOutputTokens;
  }

  // const responseFormat = toGroqResponseFormat(request, {
  //   ...options,
  //   relaxedSchema,
  // });
  const responseFormat = toGroqResponseFormat(request);

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  return body;
};

const parseGroqErrorMessage = async (response) => {
  const responseBody = await response.text();

  try {
    const parsedBody = JSON.parse(responseBody);
    return parsedBody?.error?.message || parsedBody?.message || responseBody;
  } catch {
    return responseBody || `Groq request failed with status ${response.status}`;
  }
};

const isGroqSchemaGenerationError = (message) => {
  const normalizedMessage = String(message || "").toLowerCase();

  return (
    normalizedMessage.includes("failed_generation") ||
    normalizedMessage.includes("generated json does not match") ||
    normalizedMessage.includes("does not validate with")
  );
};

const sendGroqRequest = async (request, model, options = {}) => {
  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toGroqRequestBody(request, model, options)),
  });

  if (!response.ok) {
    const error = new Error(await parseGroqErrorMessage(response));
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
};

const generateGroqContent = async ({ request, model }) => {
  let payload;

  try {
    payload = await sendGroqRequest(request, model, {
      relaxedSchema: request?.config?.groqResponseMode === "json_object",
    });
  } catch (error) {
    if (
      !isGroqSchemaGenerationError(error.message) ||
      !request?.config?.responseJsonSchema
    ) {
      throw error;
    }

    logger.warn("Retry Reason", {
      provider: PROVIDER_NAME,
      model,
      statusCode: getStatusCode(error),
      reason: "GROQ_SCHEMA_GENERATION_FAILED",
      retryMode: "json_object",
    });

    payload = await sendGroqRequest(request, model, { relaxedSchema: true });
  }

  return {
    text: payload?.choices?.[0]?.message?.content || "",
  };
};

const generateProviderContent = ({ request, model }) => {
  if (aiProvider === "groq") {
    return generateGroqContent({ request, model });
  }

  return gemini.models.generateContent({
    ...request,
    model,
  });
};

const generateWithModel = async ({ request, model, context, fallbackUsed }) => {
  let lastError;

  for (let retry = 0; retry <= MAX_RETRIES; retry += 1) {
    const attemptNumber = retry + 1;
    const attemptStartedAt = Date.now();

    logger.info("Attempt Number", {
      ...context,
      provider: PROVIDER_NAME,
      model,
      attemptNumber,
    });

    try {
      const response = await generateProviderContent({ request, model });

      logger.info("Provider Response Time", {
        ...context,
        provider: PROVIDER_NAME,
        model,
        attemptNumber,
        responseTimeMs: Date.now() - attemptStartedAt,
      });

      logger.info("Provider Success", {
        ...context,
        provider: PROVIDER_NAME,
        model,
        attemptNumber,
        fallbackUsed,
      });

      return {
        response,
        model,
      };
    } catch (error) {
      lastError = error;

      logger.info("Provider Response Time", {
        ...context,
        provider: PROVIDER_NAME,
        model,
        attemptNumber,
        responseTimeMs: Date.now() - attemptStartedAt,
      });

      logger.error("Provider Failure", {
        ...context,
        provider: PROVIDER_NAME,
        model,
        attemptNumber,
        statusCode: getStatusCode(error),
        errorType: toErrorType(error),
        message: getErrorMessage(error),
      });

      if (isModelUnavailableError(error)) {
        throw error;
      }

      if (isQuotaExhaustedError(error)) {
        throw error;
      }

      if (
        isNonRetryableError(error) ||
        !isRetryableError(error) ||
        retry === MAX_RETRIES
      ) {
        throw error;
      }

      const retryDelayMs = RETRY_DELAYS_MS[retry];

      logger.warn("Retry Reason", {
        ...context,
        provider: PROVIDER_NAME,
        model,
        attemptNumber,
        statusCode: getStatusCode(error),
        retryDelayMs,
      });

      await wait(retryDelayMs);
    }
  }

  throw lastError;
};

export const AIProvider = {
  async generateContent(request, context = {}) {
    const startedAt = Date.now();

    logger.info("AI Request Started", {
      ...context,
      provider: PROVIDER_NAME,
    });

    if (!isProviderConfigured()) {
      const error = new AIProviderError({
        errorType: "NOT_CONFIGURED",
        message: getNotConfiguredMessage(),
      });

      logger.error("Provider Failure", {
        ...context,
        provider: PROVIDER_NAME,
        errorType: error.structuredError.errorType,
        message: error.message,
      });
      logFinalResult({
        context,
        model: null,
        success: false,
        fallbackUsed: false,
        startedAt,
        error,
      });

      throw error;
    }

    logger.info("Model Selected", {
      ...context,
      provider: PROVIDER_NAME,
      model: getPrimaryModel(request),
      role: "primary",
    });

    try {
      const primaryModel = getPrimaryModel(request);
      const result = await generateWithModel({
        request,
        model: primaryModel,
        context,
        fallbackUsed: false,
      });

      logFinalResult({
        context,
        model: result.model,
        success: true,
        fallbackUsed: false,
        startedAt,
      });

      return result;
    } catch (primaryError) {
      if (
        !isModelUnavailableError(primaryError) &&
        !isRetryableError(primaryError)
      ) {
        const providerError = createProviderError(primaryError, false);
        logFinalResult({
          context,
          model: getPrimaryModel(request),
          success: false,
          fallbackUsed: false,
          startedAt,
          error: providerError,
        });
        throw providerError;
      }

      logger.warn("Fallback Activated", {
        ...context,
        provider: PROVIDER_NAME,
        primaryModel: getPrimaryModel(request),
        fallbackModel: getFallbackModel(),
        reason: toErrorType(primaryError),
      });

      logger.info("Model Selected", {
        ...context,
        provider: PROVIDER_NAME,
        model: getFallbackModel(),
        role: "fallback",
      });

      try {
        const result = await generateWithModel({
          request,
          model: getFallbackModel(),
          context,
          fallbackUsed: true,
        });

        logFinalResult({
          context,
          model: result.model,
          success: true,
          fallbackUsed: true,
          startedAt,
        });

        return result;
      } catch (fallbackError) {
        const providerError = createProviderError(fallbackError, true);
        logFinalResult({
          context,
          model: getFallbackModel(),
          success: false,
          fallbackUsed: true,
          startedAt,
          error: providerError,
        });
        throw providerError;
      }
    }
  },

  async checkHealth() {
    const { response, model } = await this.generateContent(
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Return the single word ok.",
              },
            ],
          },
        ],
        config: {
          maxOutputTokens: 4,
        },
      },
      { engine: "AiHealthCheck" },
    );

    return {
      model,
      responseTextLength: response.text?.length || 0,
    };
  },
};
