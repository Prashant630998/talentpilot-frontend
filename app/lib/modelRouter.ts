export type ModelPick = {
  primary: string;
  fallback: string;
  qa: string;
  test: string;
};

export function pickModels(): ModelPick {
  return {
    primary: process.env.DEFAULT_MODEL || "gpt-4o-mini",
    fallback: process.env.FALLBACK_MODEL || "gpt-4o",
    qa: process.env.QA_MODEL || "gpt-5",
    test: process.env.TEST_MODEL || "gpt-3.5-turbo",
  };
}

export function shouldFallback(confidence: number) {
  return confidence < 0.75;
}
