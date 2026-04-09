import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import {
  parseSermonJson,
  validateSermonOutput,
  checkForbiddenTerms,
  processReferences,
  enforceScripture,
  SermonOutput,
} from './post-processor';
import { polishSermonOutput } from './text-polisher';

interface GenerateInput {
  worshipType: string;
  targetDate: string;
  scripture: string;
  depth: string;
  targetAudience: string;
  specialInstruction?: string;
  churchSize: string;
  sermonStyle: string;
  congregationType: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: Anthropic;

  constructor(private config: ConfigService) {
    // dotenv가 main.ts에서 먼저 로드하므로 process.env 우선 사용
    const apiKey = process.env['ANTHROPIC_API_KEY'] || this.config.get('ANTHROPIC_API_KEY') || '';
    this.logger.log(`Anthropic API key loaded: ${apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING'}`);
    this.client = new Anthropic({ apiKey });
  }

  async generateSermon(
    input: GenerateInput,
    maxRetries = 2,
  ): Promise<{ output: SermonOutput; model: string; tokensUsed: number }> {
    const userPrompt = buildUserPrompt(input);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `설교 생성 시도 ${attempt + 1}/${maxRetries + 1}: ${input.scripture}`,
        );

        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          temperature: 0.7,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text =
          response.content[0].type === 'text' ? response.content[0].text : '';
        const tokensUsed =
          (response.usage?.input_tokens || 0) +
          (response.usage?.output_tokens || 0);

        // JSON 파싱
        const output = parseSermonJson(text);

        // 필수 필드 검증
        const validationErrors = validateSermonOutput(output);
        if (validationErrors.length > 0) {
          this.logger.warn(`검증 실패: ${validationErrors.join(', ')}`);
          if (attempt < maxRetries) continue;
          throw new Error(`검증 실패: ${validationErrors.join(', ')}`);
        }

        // 금지어 체크
        const forbidden = checkForbiddenTerms(output);
        if (forbidden.length > 0) {
          this.logger.warn(`금지어 감지: ${forbidden.join(', ')}`);
        }

        // 성경 본문 강제 교정
        enforceScripture(output, input.scripture);

        // 텍스트 품질 후처리
        const polished = polishSermonOutput(output);
        Object.assign(output, polished);

        // 참고자료 처리
        output.references = processReferences(output.references);

        this.logger.log(
          `설교 생성 완료: "${output.title}" (${tokensUsed} tokens)`,
        );

        return {
          output,
          model: response.model,
          tokensUsed,
        };
      } catch (error: any) {
        this.logger.error(
          `설교 생성 실패 (시도 ${attempt + 1}): ${error.message}`,
        );
        if (attempt === maxRetries) {
          throw error;
        }
        // 재시도 전 1초 대기
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    throw new Error('설교 생성에 실패했습니다');
  }

  async regenerateSermon(
    regenPrompt: string,
    maxRetries = 1,
  ): Promise<{ output: SermonOutput; tokensUsed: number }> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`재생성 시도 ${attempt + 1}/${maxRetries + 1}`);

        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          temperature: 0.7,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: regenPrompt }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

        const output = parseSermonJson(text);
        const errors = validateSermonOutput(output);
        if (errors.length > 0 && attempt < maxRetries) continue;

        output.references = processReferences(output.references);
        return { output, tokensUsed };
      } catch (error: any) {
        this.logger.error(`재생성 실패 (시도 ${attempt + 1}): ${error.message}`);
        if (attempt === maxRetries) throw error;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw new Error('재생성에 실패했습니다');
  }

  async analyzeSermon(text: string): Promise<{ output: any }> {
    const prompt = `아래 설교문을 분석해주세요.

## 설교문
${text.substring(0, 3000)}

## 분석 기준
1. 전달력: 청중이 이 설교를 들었을 때 메시지가 잘 전달되는지
2. 구조: 서론-본론-적용-결론 구조가 명확한지
3. 개선점: 더 나은 설교가 되기 위한 구체적 제안

반드시 아래 JSON 형식으로만 응답하세요:
{
  "deliveryLabel": "좋음" 또는 "보통" 또는 "약함",
  "deliveryScore": "전달력에 대한 1~2문장 설명",
  "structureEval": "구조에 대한 1~2문장 설명",
  "suggestions": ["개선 제안 1", "개선 제안 2", "개선 제안 3"]
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const parsed = JSON.parse(responseText);
      return { output: parsed };
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) return { output: JSON.parse(match[0]) };
      return {
        output: {
          deliveryLabel: '보통',
          deliveryScore: '분석 결과를 파싱할 수 없습니다.',
          structureEval: '다시 시도해주세요.',
          suggestions: ['설교문을 다시 입력해주세요.'],
        },
      };
    }
  }

  async improveSermon(originalText: string, suggestions: string[]): Promise<{ output: any }> {
    const prompt = `아래 설교문을 개선해주세요.

## 원본 설교문
${originalText.substring(0, 3000)}

## 개선 방향
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 요청
위 개선 방향을 반영하여 설교를 다시 작성해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "title": "설교 제목",
  "scripture": "성경 본문 (원본에서 추출)",
  "summary": "요약 2~3문장",
  "introduction": "서론",
  "outline": [
    {"point": 1, "title": "대지 제목", "content": "대지 내용"},
    {"point": 2, "title": "대지 제목", "content": "대지 내용"},
    {"point": 3, "title": "대지 제목", "content": "대지 내용"}
  ],
  "application": "적용 포인트",
  "conclusion": "결론",
  "improvements": ["개선된 점 1", "개선된 점 2", "개선된 점 3"]
}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      return { output: JSON.parse(text) };
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return { output: JSON.parse(match[0]) };
      throw new Error('개선 결과 파싱 실패');
    }
  }
}
