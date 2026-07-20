const FALLBACK_PHASE_DURATION_MS = 80;

function parseTimeValue(value) {
  const normalizedValue = value.trim();

  if (normalizedValue.endsWith("ms")) {
    return Number.parseFloat(normalizedValue);
  }

  if (normalizedValue.endsWith("s")) {
    return Number.parseFloat(normalizedValue) * 1000;
  }

  return 0;
}

function getPhaseDurationMs(element) {
  const durations = getComputedStyle(element).transitionDuration
    .split(",")
    .map(parseTimeValue);
  const longestDuration = Math.max(...durations);

  return longestDuration > 0 ? longestDuration : FALLBACK_PHASE_DURATION_MS;
}

function prefersReducedMotion() {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

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
      getPhaseDurationMs(element)
    );
  }

  return { replace };
}
