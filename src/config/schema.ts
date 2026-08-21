import { z } from 'zod'

export const ConfigSchema = z
  .object({
    anilist: z.object({
      username: z.string().min(1).max(64).optional(),
    }),
    mal: z.object({
      clientId: z
        .string()
        .min(8, 'mal.clientId is required and must look like a real client id')
        .optional(),
      clientSecret: z.string().optional(),
    }),
  })
  .strict()

export type Config = z.infer<typeof ConfigSchema>

export const TokenSchema = z
  .object({
    access_token: z.string().min(10),
    refresh_token: z.string().min(10),
    token_type: z.literal('Bearer'),
    expires_at: z.string().datetime({ offset: true }),
  })
  .strict()

export type Token = z.infer<typeof TokenSchema>

export const ExcludesSchema = z.array(z.number().int().positive()).default([])

export type Excludes = z.infer<typeof ExcludesSchema>

export const PkceSchema = z
  .object({
    verifier: z.string().min(43).max(128),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict()

export type PkceData = z.infer<typeof PkceSchema>
