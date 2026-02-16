"use server";

import { aiSuggestedTasks, type AiSuggestedTasksInput } from '@/ai/flows/ai-suggested-tasks';
import { z } from 'zod';

const formSchema = z.object({
  disasterType: z.string().min(3, "Disaster type is required."),
  affectedIndividualsRequests: z.string().min(10, "Requests are required."),
  availableResources: z.string().min(10, "Resource information is required."),
  volunteerSkills: z.string().min(10, "Volunteer skills are required."),
  volunteerLocations: z.string().min(10, "Volunteer locations are required."),
});


export async function getAiSuggestions(formData: AiSuggestedTasksInput) {
    const validatedFields = formSchema.safeParse(formData);

    if (!validatedFields.success) {
        return {
            error: "Invalid form data.",
            details: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await aiSuggestedTasks(validatedFields.data);
        return { data: result.suggestedTasks };
    } catch (error) {
        console.error("AI suggestion flow failed:", error);
        return { error: "An unexpected error occurred while generating suggestions." };
    }
}
