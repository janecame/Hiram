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
    .max(600, "Keep the description under 600 characters")
    .optional(),
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
  quantity: z.coerce
    .number({ invalid_type_error: "Enter a quantity" })
    .int("Use a whole number")
    .min(1, "At least 1")
    .max(99, "That seems too high")
    .default(1),
  requirements: z
    .string()
    .trim()
    .max(400, "Keep requirements under 400 characters")
    .optional(),
  imageUrl: z.string().optional(),
  // `area` is composed at submit time from addressDetail + barangay/city/province,
  // so it is not directly validated — the PSGC fields below are the real inputs.
  area: z.string().trim().max(160, "Location name is too long").optional(),
  province: z.string().trim().min(1, "Select a province"),
  city: z.string().trim().min(1, "Select a city / municipality"),
  barangay: z.string().trim().min(1, "Select a barangay"),
  addressDetail: z
    .string()
    .trim()
    .max(160, "Keep the address detail short")
    .optional(),
  condition: z.enum(CONDITIONS as [string, ...string[]], {
    errorMap: () => ({ message: "Pick a condition" }),
  }),
  lat: z.number({ invalid_type_error: "Set the item location on the map" }),
  lng: z.number({ invalid_type_error: "Set the item location on the map" }),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;
