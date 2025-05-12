import * as z from "zod"

export const CouponSchema = z.object({
  name: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  code: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1).max(100),
  startDate: z.date(),
  endDate: z.date(),
  active: z.boolean().default(true),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  size: z.enum(["small", "large"]).default("small"),
  terms: z.string().optional(),
})

export type Coupon = z.infer<typeof CouponSchema>
