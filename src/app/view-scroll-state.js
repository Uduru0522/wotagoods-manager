const COMPACT_ENTER_SCROLL_TOP = 96;
const COMPACT_EXIT_SCROLL_TOP = 32;
const COMPACT_ENTER_SCROLL_BOTTOM = COMPACT_ENTER_SCROLL_TOP;

export function bindViewScrollState(viewPanel) {
  const workspace = viewPanel.closest(".workspace");

  if (!workspace) {
    return;
  }

  let isCompact = false;

  function update() {
    const maxScrollTop = Math.max(0, viewPanel.scrollHeight - viewPanel.clientHeight);
    const distanceToBottom = maxScrollTop - viewPanel.scrollTop;
    const canScrollEnough =
      maxScrollTop > COMPACT_ENTER_SCROLL_TOP + COMPACT_ENTER_SCROLL_BOTTOM;
    const isPastTopEnter = viewPanel.scrollTop > COMPACT_ENTER_SCROLL_TOP;
    const isPastBottomEnter = distanceToBottom > COMPACT_ENTER_SCROLL_BOTTOM;
    const isNearTopExit = viewPanel.scrollTop < COMPACT_EXIT_SCROLL_TOP;

    if (!canScrollEnough) {
      isCompact = false;
    } else if (!isCompact && isPastTopEnter && isPastBottomEnter) {
      isCompact = true;
    } else if (isCompact && isNearTopExit) {
      isCompact = false;
    }

    workspace.toggleAttribute("data-view-scrolled", isCompact);
  }

  viewPanel.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}
