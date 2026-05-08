import dotenv from 'dotenv';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeModel } from '#constants/anthropic-models';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.local') });

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

const anthropic = new Anthropic({ apiKey });

export const editorModel: ClaudeModel =
  process.env.NODE_ENV === 'development' ? ClaudeModel.Haiku4_5 : ClaudeModel.Opus4_7;

export default anthropic;
