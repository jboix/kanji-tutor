/** English messages: why the AI tutor gave no answer (shared by every feature). */
export const ai = {
  offline: 'You are offline. Explanations need a connection; the rest still works.',
  noKey: 'Add a Gemini key in Settings to use the AI tutor.',
  rateLimit: 'The tutor needs a minute: Gemini is limiting requests for this key.',
  needsMinute: 'The tutor needs a minute.',
  askAgainIn: 'You can ask again in {n} s.',
  askAgainNow: 'You can ask again now.',
  invalid: 'The reply could not be read.',
  cancelled: 'The request was cancelled.',
  refused: 'Gemini refused the request ({status}). Check the key and model in Settings.',
  noAnswer: 'Gemini did not answer.',
} as const;
