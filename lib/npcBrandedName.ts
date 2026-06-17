/** Provider prefix → short brand shown before NPC names (e.g. "Claude Chad"). */
const BRAND_BY_PROVIDER: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'GPT',
  google: 'Gemini',
  'meta-llama': 'Llama',
  deepseek: 'DeepSeek',
  mistralai: 'Mistral',
  qwen: 'Qwen',
  'x-ai': 'Grok',
  cohere: 'Cohere',
};

export function npcBrandFromModelId(modelId: string | undefined): string | undefined {
  if (!modelId?.trim()) return undefined;
  const provider = modelId.split('/')[0]?.toLowerCase() ?? '';
  return BRAND_BY_PROVIDER[provider];
}

export function formatNpcBrandedName(
  characterName: string,
  opts?: { modelId?: string; modelBrand?: string },
): string {
  const base = characterName.trim();
  if (!base) return '';
  const brand =
    opts?.modelBrand?.trim() ||
    (opts?.modelId ? npcBrandFromModelId(opts.modelId) : undefined);
  const proper = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  return proper;
}
