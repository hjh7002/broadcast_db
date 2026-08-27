import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

export const CHAT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
