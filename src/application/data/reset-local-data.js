export function createResetLocalDataOperation({ storage }) {
  return async function resetLocalData() {
    await storage.resetData();
  };
}
