import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.example") });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    CLIENT_URL: z
      .string()
      .default("http://localhost:5173,http://localhost:5174")
      .refine(
        (value) =>
          value
            .split(",")
            .map((origin) => origin.trim())
            .every((origin) => z.string().url().safeParse(origin).success),
        "CLIENT_URL must be a comma-separated list of valid URLs",
    ),
    MONGODB_URI: z.string().default(""),
    GEMINI_API_KEY: z.string().default(""),
    GROQ_API_KEY: z.string().default(""),
    GROQ_OPENAI_API_KEY: z.string().default(""),
    OPENAI_API_KEY: z.string().default(""),
    AI_PROVIDER: z.enum(["gemini", "groq"]).default("groq"),
    GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
    GEMINI_FALLBACK_MODEL: z.string().min(1).default("gemini-2.5-pro"),
    GROQ_TEXT_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
    GROQ_VISION_MODEL: z
      .string()
      .min(1)
      .default("meta-llama/llama-4-scout-17b-16e-instruct"),
    GROQ_FALLBACK_MODEL: z
      .string()
      .min(1)
      .default("meta-llama/llama-4-scout-17b-16e-instruct"),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === "production" && !value.MONGODB_URI) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MONGODB_URI"],
        message: "MONGODB_URI is required in production",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.AI_PROVIDER === "gemini" &&
      !value.GEMINI_API_KEY
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message: "GEMINI_API_KEY is required in production when AI_PROVIDER=gemini",
      });
    }

    if (
      value.NODE_ENV === "production" &&
      value.AI_PROVIDER === "groq" &&
      !value.GROQ_API_KEY &&
      !value.GROQ_OPENAI_API_KEY &&
      !value.OPENAI_API_KEY
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GROQ_API_KEY"],
        message: "GROQ_API_KEY is required in production when AI_PROVIDER=groq",
      });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
