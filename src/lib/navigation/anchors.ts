// normal document-flow sections don't need the pin-relative math skills/projects
// need — they just sit where they sit
export function getSectionAnchorScrollY(section: HTMLElement) {
  return section.offsetTop;
}
