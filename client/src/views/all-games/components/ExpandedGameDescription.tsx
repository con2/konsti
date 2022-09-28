import React, { ReactElement } from "react";
import { GameInfo } from "client/views/all-games/components/GameInfo";
import { AdminActionCard } from "client/views/all-games/components/AdminActionCard";
import { useAppSelector } from "client/utils/hooks";
import { FeedbackForm } from "client/views/all-games/components/FeedbackForm";
import { Game } from "shared/typings/models/game";

interface Props {
  game: Game;
}

export const ExpandedGameDescription = ({ game }: Props): ReactElement => {
  const loggedIn = useAppSelector((state) => state.login.loggedIn);
  const userGroup = useAppSelector((state) => state.login.userGroup);

  return (
    <>
      <GameInfo game={game} />
      {loggedIn && <FeedbackForm game={game} />}
      {loggedIn && userGroup === "admin" && <AdminActionCard game={game} />}
    </>
  );
};
