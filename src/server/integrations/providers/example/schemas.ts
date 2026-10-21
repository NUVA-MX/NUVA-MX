import 'server-only';
import { z } from 'zod';

export const pingInputSchema = z.object({ message: z.string().min(1).max(200) });
export type PingInput = z.infer<typeof pingInputSchema>;

export const pingResultSchema = z.object({
  id: z.string().min(1).max(100),
  message: z.string().max(200),
  receivedAt: z.string().max(40),
});
export type PingResult = z.infer<typeof pingResultSchema>;

export const exampleWebhookSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  created: z.number().int().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});
export type ExampleWebhookBody = z.infer<typeof exampleWebhookSchema>;
