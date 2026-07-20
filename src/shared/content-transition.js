import {
  getTransitionDurationMs,
  prefersReducedMotion
} from "./motion.js";

const FALLBACK_PHASE_DURATION_MS = 80;

export function createContentTransition(element, { animateInitial = false } = {}) {
  let operationId = 0;
  let exitTimer = 0;
  let enterFrame = 0;
  let hasRendered = element.hasChildNodes();

  element.classList.add("content-transition");

  function clearPendingWork() {
    globalThis.clearTimeout(exitTimer);
    globalThis.cancelAnimationFrame?.(enterFrame);
    exitTimer = 0;
    enterFrame = 0;
  }

  function prepareEntrance(currentOperationId) {
    if (!element.hasChildNodes() || prefersReducedMotion()) {
      delete element.dataset.contentTransition;
      return;
    }

    element.classList.add("content-transition-preparing");
    element.dataset.contentTransition = "enter";
    void element.offsetWidth;
    element.classList.remove("content-transition-preparing");

    enterFrame = globalThis.requestAnimationFrame(() => {
      if (currentOperationId === operationId) {
        delete element.dataset.contentTransition;
      }
    });
  }

  function commit(currentOperationId, update, afterUpdate) {
    if (currentOperationId !== operationId) {
      return;
    }

    update();
    hasRendered = true;
    afterUpdate?.();
    prepareEntrance(currentOperationId);
  }

  function replace(update, { afterUpdate } = {}) {
    const currentOperationId = ++operationId;
    const shouldAnimateExit = hasRendered && element.hasChildNodes() && !prefersReducedMotion();

    clearPendingWork();

    if (!shouldAnimateExit) {
      update();
      hasRendered = true;
      afterUpdate?.();

      if (animateInitial) {
        prepareEntrance(currentOperationId);
      } else {
        delete element.dataset.contentTransition;
      }

      return;
    }

    element.dataset.contentTransition = "exit";
    exitTimer = globalThis.setTimeout(
      () => commit(currentOperationId, update, afterUpdate),
      getTransitionDurationMs(element, FALLBACK_PHASE_DURATION_MS)
    );
  }

  return { replace };
}
