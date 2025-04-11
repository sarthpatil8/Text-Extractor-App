// mistralApi.ts
import API_KEY from './config';

export interface MistralResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Function to process OCR text with Mistral API
export async function processImageWithMistral(base64DataUrl: string): Promise<MistralResponse> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "pixtral-12b-latest",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: base64DataUrl },
            },
            {
              type: "text",
              text: "Extract all text content from this image and format it as markdown."
            }
          ]
        }
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API error: ${response.status} - ${errorData}`);
  }

  return response.json() as Promise<MistralResponse>;
}

// Function to extract structured data from the OCR text
export async function extractStructuredData(ocrText: string): Promise<MistralResponse> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "pixtral-12b-latest",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is image's OCR in markdown:\n\n${ocrText}\n.\nConvert this into a sensible structured json response. The output should strictly be json with no extra commentary`
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API error: ${response.status} - ${errorData}`);
  }

  return response.json() as Promise<MistralResponse>;
}