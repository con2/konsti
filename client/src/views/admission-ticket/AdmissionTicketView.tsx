import { ReactElement, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BackButton } from "client/components/BackButton";
import { useAppSelector } from "client/utils/hooks";
import { Admission } from "client/views/admission-ticket/Admission";
import { selectDirectSignups } from "client/views/my-program-items/myProgramItemsSlice";

export const AdmissionTicketView = (): ReactElement => {
  const { t } = useTranslation();

  const { programItemId } = useParams();

  const [loading, setLoading] = useState<boolean>(true);

  const programItems = useAppSelector(
    (state) => state.allProgramItems.programItems,
  );

  const foundProgramItem = programItems.find(
    (programItem) => programItem.programItemId === programItemId,
  );

  const directSignups = useAppSelector(selectDirectSignups);

  const isSignedUp =
    directSignups.findIndex(
      (ds) => ds.programItem.programItemId === programItemId,
    ) > 0;

  useEffect(() => {
    setLoading(false);
  }, [foundProgramItem, isSignedUp]);

  return (
    <div>
      <BackButton />
      {!loading && !foundProgramItem && (
        <p>{t("invalidProgramItemId", { PROGRAM_ITEM_ID: programItemId })}</p>
      )}
      {!loading && foundProgramItem && (
        <Admission programItem={foundProgramItem} isSignedUp={isSignedUp} />
      )}
    </div>
  );
};
