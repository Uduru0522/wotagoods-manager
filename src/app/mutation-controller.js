export function createMutationController(root) {
  let isActive = false;

  async function run(operation) {
    if (isActive) {
      throw new Error("Another database change is already in progress.");
    }

    isActive = true;
    root.toggleAttribute("data-mutating", true);
    root.setAttribute("aria-busy", "true");

    try {
      return await operation();
    } finally {
      isActive = false;
      root.removeAttribute("data-mutating");
      root.removeAttribute("aria-busy");
    }
  }

  return {
    get isActive() {
      return isActive;
    },
    run
  };
}
