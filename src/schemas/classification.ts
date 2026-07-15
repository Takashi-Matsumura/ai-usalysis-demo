import { z } from "zod";
import type { DimensionOptions } from "@/server/category-options";

export function buildClassificationSchema(options: DimensionOptions) {
  return z.object({
    business_category: z.enum(options.business_category as [string, ...string[]]),
    usage_purpose: z.enum(options.usage_purpose as [string, ...string[]]),
    task_type: z.enum(options.task_type as [string, ...string[]]),
    improvement_type: z.enum(options.improvement_type as [string, ...string[]]),
    automation_potential: z.enum(options.automation_potential as [string, ...string[]]),
    rag_candidate: z.boolean(),
    sensitivity_level: z.enum(options.sensitivity_level as [string, ...string[]]),
    confidence: z.number().min(0).max(1),
  });
}

export type ClassificationResult = {
  business_category: string;
  usage_purpose: string;
  task_type: string;
  improvement_type: string;
  automation_potential: string;
  rag_candidate: boolean;
  sensitivity_level: string;
  confidence: number;
};

export const CLASSIFICATION_VERSION = "v1";
