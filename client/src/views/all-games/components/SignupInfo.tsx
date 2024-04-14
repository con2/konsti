import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "shared/types/models/game";
import { useAppDispatch } from "client/utils/hooks";

interface Props {
  game: Game;
}

export const SignupInfo = ({ game }: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  return <div>TODO</div>;
};
