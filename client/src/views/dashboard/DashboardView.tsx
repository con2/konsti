import { ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AssignmentRun } from "shared/types/models/result";
import { Loading } from "client/components/Loading";
import { RaisedCard } from "client/components/RaisedCard";
import { getResults } from "client/services/resultsServices";
import { useTimeFormatters } from "client/utils/useTimeFormatters";

export const DashboardView = (): ReactElement => {
  const { t } = useTranslation();
  const { getDateAndTime } = useTimeFormatters();

  const [assignmentRuns, setAssignmentRuns] = useState<AssignmentRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<boolean>(false);

  useEffect(() => {
    const loadResults = async (): Promise<void> => {
      const response = await getResults();
      if (response.status === "error") {
        setLoadingError(true);
      } else {
        setAssignmentRuns(
          [...response.assignmentRuns].sort((a, b) =>
            b.assignmentTime.localeCompare(a.assignmentTime),
          ),
        );
      }
      setLoading(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadResults();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <h2>{t("dashboardView.title")}</h2>

      {loadingError && <p>{t("dashboardView.loadingError")}</p>}

      {!loadingError && assignmentRuns.length === 0 && (
        <p>{t("dashboardView.noResults")}</p>
      )}

      {assignmentRuns.map((assignmentRun) => (
        <RaisedCard
          key={assignmentRun.assignmentTime}
          data-testid="assignment-run"
        >
          <h3>{getDateAndTime(assignmentRun.assignmentTime)}</h3>
          <p>
            {t("dashboardView.algorithm")}: {assignmentRun.algorithm}
          </p>
          {assignmentRun.message && (
            <p>
              {t("dashboardView.message")}: {assignmentRun.message}
            </p>
          )}
        </RaisedCard>
      ))}
    </div>
  );
};
