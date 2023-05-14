import { ReactElement, FormEvent, useState, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Game } from "shared/typings/models/game";
import {
  PostSignedGamesErrorMessage,
  submitPostSignedGames,
} from "client/views/my-games/myGamesThunks";
import { useAppDispatch, useAppSelector } from "client/utils/hooks";
import { Button, ButtonStyle } from "client/components/Button";
import { ErrorMessage } from "client/components/ErrorMessage";
import { Dropdown } from "client/components/Dropdown";
import { ButtonGroup } from "client/components/ButtonGroup";

interface Props {
  game: Game;
  startTime: string;
  onCancel: () => void;
}

const OPTIONS = [1, 2, 3];

export const SignupForm = ({
  game,
  startTime,
  onCancel,
}: Props): ReactElement => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  // We need all signed games here
  const signedGames = useAppSelector((state) => state.myGames.signedGames);
  const username = useAppSelector((state) => state.login.username);

  const selectedPriorities = signedGames
    .filter((signedGame) => signedGame.gameDetails.startTime === startTime)
    .map((signedGame) => signedGame.priority);

  const firstUnselected = OPTIONS.filter(
    (option) => !selectedPriorities.includes(option)
  );

  const firstOption = firstUnselected.length > 0 ? firstUnselected[0] : 1;

  const [priority, setPriority] = useState<number | null>(firstOption);

  const [errorMessage, setErrorMessage] =
    useState<PostSignedGamesErrorMessage | null>(null);

  const onChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setPriority(parseInt(event.target.value, 10));
  };

  const handleCancel = (): void => {
    onCancel();
  };

  const handleSignup = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!priority) {
      return;
    }

    const newGame = [
      {
        gameDetails: game,
        priority,
        time: game.startTime,
        message: "",
      },
    ];

    const error = await dispatch(
      submitPostSignedGames({
        username,
        selectedGames: signedGames.concat(newGame),
        startTime: game.startTime,
      })
    );

    if (error) {
      setErrorMessage(error);
    } else {
      setErrorMessage(null);
    }
  };

  const options = OPTIONS.map((n) => {
    const nStr = n.toString(10);
    return {
      value: nStr,
      title: nStr,
      disabled: selectedPriorities.includes(n),
    };
  });

  return (
    <form>
      {t("signup.gamePriority")}{" "}
      <StyledDropdown
        onChange={onChange}
        options={options}
        selectedValue={firstOption.toString()}
      />
      <ButtonGroup>
        <Button onClick={handleSignup} buttonStyle={ButtonStyle.PRIMARY}>
          {t("signup.confirm")}
        </Button>
        <Button onClick={handleCancel} buttonStyle={ButtonStyle.SECONDARY}>
          {t("signup.cancel")}
        </Button>
      </ButtonGroup>
      {errorMessage && (
        <ErrorMessage
          message={t(errorMessage)}
          closeError={() => setErrorMessage(null)}
        />
      )}
    </form>
  );
};

const StyledDropdown = styled(Dropdown)`
  margin-right: 8px;
`;
