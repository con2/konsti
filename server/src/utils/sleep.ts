export const sleep = async (ms: number): Promise<void> => {
  return await new Promise<void>((resolve) => setTimeout(resolve, ms));
};
