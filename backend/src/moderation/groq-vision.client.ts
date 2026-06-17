import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GROQ_API_BASE_URL } from './moderation.constants';

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: Array<{
        function?: {
          arguments?: string;
        };
      }>;
    };
  }>;
}

@Injectable()
export class GroqVisionClient {
  private readonly logger = new Logger(GroqVisionClient.name);

  constructor(private readonly configService: ConfigService) {}

  async analyzeImage(
    imageBuffer: Buffer,
    mimeType: string,
    prompt: string,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('groqApiKey');
    const model = this.configService.get<string>('groqVisionModel');

    if (!apiKey) {
      throw new InternalServerErrorException('GROQ_API_KEY is not configured');
    }

    if (!model) {
      throw new InternalServerErrorException(
        'GROQ_VISION_MODEL is not configured',
      );
    }

    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: { url: imageDataUrl },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Groq API request failed (${response.status}): ${errorBody}`,
      );
      throw new InternalServerErrorException(
        `Moderation service unavailable (Groq ${response.status}). Check GROQ_VISION_MODEL — a 404 usually means the model ID is invalid. Response: ${errorBody}`,
      );
    }

    const payload = (await response.json()) as GroqChatCompletionResponse;
    const message = payload.choices?.[0]?.message;

    if (message?.tool_calls?.[0]?.function?.arguments) {
      return message.tool_calls[0].function.arguments;
    }

    if (message?.content) {
      return message.content;
    }

    throw new InternalServerErrorException(
      'Moderation service returned an empty response',
    );
  }
}
