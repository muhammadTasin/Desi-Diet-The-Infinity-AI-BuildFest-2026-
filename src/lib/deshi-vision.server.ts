import { z } from "zod";

const DESHI_FOOD_IDS = [
  "bakorkhani",
  "bangladeshi_biryani",
  "beguni",
  "bhapa_pitha",
  "chickpea_curry",
  "chitoi_pitha",
  "egg_omelette",
  "fuchka",
  "haleem",
  "hilsa_fish",
  "jamai_pitha",
  "kacha_golla",
  "kala_bhuna",
  "kebab",
  "khichuri",
  "morog_polao",
  "nakshi_pitha",
  "naru",
  "nehari",
  "paratha",
  "patishapta_pitha",
  "potato_bhorta",
  "puli_pitha",
  "roshgolla",
  "roshmalai",
  "sweet_yogurt",
  "teler_pitha",
] as const;

export type DeshiFoodId = (typeof DESHI_FOOD_IDS)[number];

const FoodIdSchema = z.enum(DESHI_FOOD_IDS);

const ApiResponseSchema = z.object({
  food_id: FoodIdSchema,
  valid: z.boolean(),
  latency_seconds: z.number().optional(),
  model: z.string().optional(),
  filename: z.string().optional(),
});

export type DeshiVisionResult = {
  detected: boolean;
  foodId?: DeshiFoodId;
  foodName?: string;
  latencySeconds?: number;
  provider: "cp645";
  error?: string;
};

const FOOD_DISPLAY_NAMES: Record<DeshiFoodId, string> = {
  bakorkhani: "Bakorkhani",
  bangladeshi_biryani: "Bangladeshi Biryani",
  beguni: "Beguni",
  bhapa_pitha: "Bhapa Pitha",
  chickpea_curry: "Chickpea Curry",
  chitoi_pitha: "Chitoi Pitha",
  egg_omelette: "Egg Omelette",
  fuchka: "Fuchka",
  haleem: "Haleem",
  hilsa_fish: "Hilsa Fish",
  jamai_pitha: "Jamai Pitha",
  kacha_golla: "Kacha Golla",
  kala_bhuna: "Kala Bhuna",
  kebab: "Kebab",
  khichuri: "Khichuri",
  morog_polao: "Morog Polao",
  nakshi_pitha: "Nakshi Pitha",
  naru: "Naru",
  nehari: "Nehari",
  paratha: "Paratha",
  patishapta_pitha: "Patishapta Pitha",
  potato_bhorta: "Potato Bhorta",
  puli_pitha: "Puli Pitha",
  roshgolla: "Roshgolla",
  roshmalai: "Roshmalai",
  sweet_yogurt: "Sweet Yogurt (Mishti Doi)",
  teler_pitha: "Teler Pitha",
};

function getApiUrl(): string {
  return (
    process.env.DESHI_VISION_API_URL?.trim() ||
    "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
}

function getApiToken(): string | null {
  const token = process.env.DESHI_VISION_API_TOKEN?.trim();
  return token || null;
}

function getTimeoutMs(): number {
  const parsed = Number(process.env.DESHI_VISION_TIMEOUT_MS ?? "4000");

  if (!Number.isFinite(parsed) || parsed < 500) {
    return 4000;
  }

  return parsed;
}

export async function analyzeImageWithDeshiVision(
  imageBase64: string,
  mimeType: string
): Promise<DeshiVisionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const bytes = Buffer.from(imageBase64, "base64");

    if (!bytes.length) {
      throw new Error("Image payload is empty.");
    }

    const extension =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
          ? "webp"
          : mimeType === "image/bmp"
            ? "bmp"
            : "jpg";

    const form = new FormData();

    form.append(
      "file",
      new Blob([bytes], { type: mimeType }),
      `plate.${extension}`
    );

    const token = getApiToken();

    const response = await fetch(`${getApiUrl()}/predict-food`, {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `CP645 API returned HTTP ${response.status}`
      );
    }

    const payload = ApiResponseSchema.parse(await response.json());

    if (!payload.valid) {
      return {
        detected: false,
        provider: "cp645",
        error: "CP645 returned an invalid classification.",
      };
    }

    return {
      detected: true,
      foodId: payload.food_id,
      foodName: FOOD_DISPLAY_NAMES[payload.food_id],
      latencySeconds: payload.latency_seconds,
      provider: "cp645",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "CP645 request timed out."
          : error.message
        : "CP645 request failed.";

    console.warn("[deshi-vision] CP645 unavailable:", message);

    return {
      detected: false,
      provider: "cp645",
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
