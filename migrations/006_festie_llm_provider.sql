-- Festie LLM provider preference (Claude, GPT, Gemini, etc.)

ALTER TABLE festies
  ADD COLUMN IF NOT EXISTS llm_provider text NOT NULL DEFAULT 'openai';
