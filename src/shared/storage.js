import { DEFAULT_STATE } from "./defaults.js";

const STORAGE_KEY = "promptTemplates";

export async function loadState() {
  const result = await chrome.storage.sync.get([STORAGE_KEY]);
  if (result[STORAGE_KEY]) {
    return result[STORAGE_KEY];
  }
  await chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_STATE });
  return DEFAULT_STATE;
}

export async function saveState(state) {
  await chrome.storage.sync.set({ [STORAGE_KEY]: state });
}
