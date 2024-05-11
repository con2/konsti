import { ProgramItem, ProgramType } from "shared/types/models/programItem";

export const isRevolvingDoorWorkshop = (programItem: ProgramItem): boolean => {
  return (
    programItem.programType === ProgramType.WORKSHOP &&
    programItem.revolvingDoor
  );
};
