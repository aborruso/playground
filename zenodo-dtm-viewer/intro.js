export const INTRO_SEEN_KEY='zenodo-dtm:intro-seen';
export function showIntroOnce(dialog,storage) {
  let local=storage;
  try {
    local ??= globalThis.localStorage;
    if(local?.getItem(INTRO_SEEN_KEY)==='1') return false;
  } catch {
    // A blocked browser store must not prevent opening the map.
  }
  dialog.showModal();
  try {local?.setItem(INTRO_SEEN_KEY,'1');} catch {
    // Without persistence the information will be shown again next visit.
  }
  return true;
}
