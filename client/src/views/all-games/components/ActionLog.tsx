import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Accordion } from "client/components/Accordion";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { FavoriteButton } from "client/components/FavoriteButton";
import { submitUpdateActionLogIsSeen } from "client/views/login/loginThunks";

export const ActionLog = (): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const actionLogItems = useAppSelector((state) => state.login.actionLogItems);
  const username = useAppSelector((state) => state.login.username);

  return (
    <div>
      <Accordion
        closeAccordionText={t("actionLog.title")}
        openAccordionText={t("actionLog.title")}
      >
        <ActionLogItems>
          {actionLogItems.map((actionLogItem) => {
            return (
              <div key={actionLogItem.action}>
                <ActionTitle isSeen={actionLogItem.isSeen}>
                  {t(`actionLogActions.${actionLogItem.action}`)}:{" "}
                  {actionLogItem.eventItemId}
                </ActionTitle>
                <FavoriteButton
                  isFavorite={actionLogItem.isSeen}
                  onClick={async () => {
                    await dispatch(
                      submitUpdateActionLogIsSeen({
                        username,
                        actionLogItemId: actionLogItem.actionLogItemId,
                        isSeen: !actionLogItem.isSeen,
                      })
                    );
                  }}
                />
              </div>
            );
          })}
        </ActionLogItems>
      </Accordion>
    </div>
  );
};

const ActionLogItems = styled.div`
  padding: 8px;
`;

const ActionTitle = styled.span<{ isSeen: boolean }>`
  color: ${(props) => (props.isSeen ? "gray" : "black")};
`;
