export const flags = {
  FEATURE_LINKEDIN_ENHANCED: process.env.FEATURE_LINKEDIN_ENHANCED === 'true',
  FEATURE_QC_LLM: process.env.FEATURE_QC_LLM !== 'false',
};

export const CALL_DURATION_MINUTES = Number(process.env.CALL_DURATION_MINUTES || '30');
