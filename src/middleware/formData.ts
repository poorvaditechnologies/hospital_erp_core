import multer from "multer";

// Every write endpoint accepts multipart/form-data. This parses the text
// fields into req.body (no files expected on these routes) before the zod
// validateBody middleware runs. If a request isn't multipart, multer leaves
// req.body untouched and calls next() — this is pure parsing, not enforcement.
export const parseFormData = multer().none();
