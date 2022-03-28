import { concurrently } from "concurrently";

export const populateDb = async (): Promise<void> => {
  const { result } = concurrently(["yarn:populate-db:dummy"]);
  await result;
};
