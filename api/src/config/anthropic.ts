import Anthropic from '@anthropic-ai/sdk';
import { env } from '#config/env';
import { ClaudeModel } from '#constants/anthropic-models';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export const editorModel: ClaudeModel =
  env.NODE_ENV === 'development' ? ClaudeModel.Haiku4_5 : ClaudeModel.Opus4_7;

export default anthropic;
