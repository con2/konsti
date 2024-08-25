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

  const isSignedUp = !!directSignups.find(
    (ds) => ds.programItem.programItemId === programItemId,
  );

  const username = useAppSelector((state) => state.login.username);

  useEffect(() => {
    setLoading(false);
  }, [/* effect dep */ foundProgramItem, /* effect dep */ isSignedUp]);

  return (
    <div>
      <BackButton />
      {!loading && !foundProgramItem && (
        <p>{t("invalidProgramItemId", { PROGRAM_ITEM_ID: programItemId })}</p>
      )}
      {!loading && foundProgramItem && (
        <Admission
          programItem={foundProgramItem}
          isSignedUp={isSignedUp}
          username={username}
        />
      )}
    </div>
  );
};
