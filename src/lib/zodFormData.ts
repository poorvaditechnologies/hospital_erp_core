import { z } from "zod";

// multipart/form-data sends every field as a string (or string[] when the
// same field name is repeated), so numbers/booleans/arrays need explicit
// coercion — these wrap the usual zod types for use in form-data body schemas.

export const formBoolean = () =>
  z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return value;
  }, z.boolean());

export const formArray = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.preprocess((value) => {
    if (value === undefined || value === "") return undefined;
    return Array.isArray(value) ? value : [value];
  }, z.array(itemSchema));
