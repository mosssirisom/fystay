import { z } from "zod";

export const httpUrlSchema = z
  .string()
  .url()
  .refine((url) => /^https?:\/\//i.test(url), {
    message: "Must be an http(s) URL",
  });
