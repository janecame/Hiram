import { z } from "zod";
import { CATEGORIES, CONDITIONS } from "../types/item";

export const itemFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(80, "Keep the title under 80 characters"),
  category: z.enum(CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: "Pick a category" }),
  }),
  description: z
    .string()
    .trim()
    .min(20, "Add a bit more detail (at least 20 characters)")
    .max(600, "Keep the description under 600 characters"),
  brand: z
    .string()
    .trim()
    .max(60, "Keep the brand name short")
    .optional(),
  pricePerDay: z.coerce
    .number({ invalid_type_error: "Enter a price" })
    .int("Use a whole peso amount")
    .min(1, "Price must be at least ₱1")
    .max(100000, "That seems too high"),
  pricePerHour: z
    .union([z.literal(""), z.coerce.number()])
    .transform((v) => (v === "" ? undefined : v))
    .pipe(
      z
        .number({ invalid_type_error: "Enter a valid amount" })
        .int("Use a whole peso amount")
        .min(1, "Price must be at least ₱1")
        .max(100000, "That seems too high")
        .optional(),
    )
    .optional(),
  requirements: z
    .string()
    .trim()
    .max(400, "Keep requirements under 400 characters")
    .optional(),
  imageUrl: z.string().optional(),
  area: z
    .string()
    .trim()
    .min(2, "Where is the item located?")
    .max(60, "Keep the area name short"),
  condition: z.enum(CONDITIONS as [string, ...string[]], {
    errorMap: () => ({ message: "Pick a condition" }),
  }),
  owner: z
    .string()
    .trim()
    .min(2, "Add your name")
    .max(40, "Keep your name short"),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;
