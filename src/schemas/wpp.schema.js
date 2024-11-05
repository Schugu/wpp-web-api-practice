import { z } from "zod";

export const phoneNumberSchema = z.object({
  number: z.string({
    invalid_type_error: "El número de celular debe ser un string.",
    required_error: "El número de celular es requerido."
  }).length(13, {
    message: "El número de celular debe tener exactamente 13 dígitos.",
  }),
});