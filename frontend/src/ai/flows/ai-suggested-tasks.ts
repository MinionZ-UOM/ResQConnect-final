// This is a server-side file.
'use server';

/**
 * @fileOverview This file defines the AI-suggested tasks flow for the admin user.
 *
 * It suggests optimal task assignments based on resource availability, volunteer
 * skills and locations, and the urgency of affected individuals' requests.
 *
 * @exports aiSuggestedTasks - The main function to trigger the AI-suggested tasks flow.
 * @exports AiSuggestedTasksInput - The input type for the aiSuggestedTasks function.
 * @exports AiSuggestedTasksOutput - The output type for the aiSuggestedTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const AiSuggestedTasksInputSchema = z.object({
  disasterType: z.string().describe('The type of disaster (e.g., flood, landslide).'),
  affectedIndividualsRequests: z.string().describe('Details of help requests from affected individuals, including location and urgency.'),
  availableResources: z.string().describe('Information about available resources, including quantity and location.'),
  volunteerSkills: z.string().describe('Information about available volunteers and their skills.'),
  volunteerLocations: z.string().describe('Information about the locations of available volunteers.'),
});

export type AiSuggestedTasksInput = z.infer<typeof AiSuggestedTasksInputSchema>;

// Define the output schema
const AiSuggestedTasksOutputSchema = z.object({
  suggestedTasks: z.string().describe('A list of suggested tasks with assigned volunteers and required resources.'),
});

export type AiSuggestedTasksOutput = z.infer<typeof AiSuggestedTasksOutputSchema>;

// Define the tool to get volunteer skills
const getVolunteerSkills = ai.defineTool({
  name: 'getVolunteerSkills',
  description: 'Retrieves the skills of available volunteers.',
  inputSchema: z.object({
    volunteerId: z.string().describe('The ID of the volunteer.'),
  }),
  outputSchema: z.string().describe('A list of skills the volunteer possesses.'),
}, async (input) => {
  // Placeholder implementation to return volunteer skills based on ID
  // In a real application, this would fetch data from a database or external source.
  return `Skills for volunteer ${input.volunteerId}: First Aid, Search and Rescue`;
});

// Define the tool to get volunteer location
const getVolunteerLocation = ai.defineTool({
  name: 'getVolunteerLocation',
  description: 'Retrieves the current location of a volunteer.',
  inputSchema: z.object({
    volunteerId: z.string().describe('The ID of the volunteer.'),
  }),
  outputSchema: z.string().describe('The current location of the volunteer (e.g., latitude and longitude).'),
}, async (input) => {
  // Placeholder implementation to return volunteer location based on ID
  // In a real application, this would fetch data from a database or external source.
  return `Location for volunteer ${input.volunteerId}: 34.0522,-118.2437`;
});

// Define the prompt
const aiSuggestedTasksPrompt = ai.definePrompt({
  name: 'aiSuggestedTasksPrompt',
  tools: [getVolunteerSkills, getVolunteerLocation],
  input: {schema: AiSuggestedTasksInputSchema},
  output: {schema: AiSuggestedTasksOutputSchema},
  prompt: `You are an AI assistant that suggests optimal task assignments for disaster response.

  Analyze the following information to suggest tasks, considering volunteer skills and locations:

  Disaster Type: {{{disasterType}}}
  Affected Individuals' Requests: {{{affectedIndividualsRequests}}}
  Available Resources: {{{availableResources}}}
  Volunteer Skills: {{{volunteerSkills}}}
  Volunteer Locations: {{{volunteerLocations}}}

  Consider the urgency of each request and match volunteers with the necessary skills and proximity to the affected individuals.

  Output a list of suggested tasks with assigned volunteers and required resources.
  The output must be a JSON array.

  Example:
  [
    {
      "taskId": "1",
      "description": "Rescue stranded residents in flooded area",
      "volunteer": "John Doe",
      "resources": "Boat, life jackets",
      "location": "123 Main Street"
    },
    {
      "taskId": "2",
      "description": "Provide first aid to injured individuals",
      "volunteer": "Jane Smith",
      "resources": "First aid kit, medical supplies",
      "location": "456 Elm Avenue"
    }
  ]
  `,
});

// Define the flow
const aiSuggestedTasksFlow = ai.defineFlow(
  {
    name: 'aiSuggestedTasksFlow',
    inputSchema: AiSuggestedTasksInputSchema,
    outputSchema: AiSuggestedTasksOutputSchema,
  },
  async input => {
    const {output} = await aiSuggestedTasksPrompt(input);
    return output!;
  }
);

/**
 * Suggests optimal task assignments based on real-time analysis of resource availability,
 * volunteer skills and locations, and the urgency of affected individuals' requests.
 * @param input - The input parameters for generating AI-suggested tasks.
 * @returns A promise that resolves to the suggested tasks.
 */
export async function aiSuggestedTasks(input: AiSuggestedTasksInput): Promise<AiSuggestedTasksOutput> {
  return aiSuggestedTasksFlow(input);
}
