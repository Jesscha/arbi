import tokens from "./tokens.json";

export const TOKENS = tokens;
export const TOKENS_MAP = tokens.reduce((prev, cur) => {
  prev[cur.symbol] = cur;
  return prev;
}, {} as any);
