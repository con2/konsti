import { ReactElement, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AppRoute } from "client/app/AppRoutes";
import { Loading } from "client/components/Loading";
import { useAppDispatch } from "client/utils/hooks";
import {
  clearKompassiLoginState,
  getKompassiLoginState,
} from "client/utils/sessionStorage";
import {
  LoginErrorMessage,
  submitKompassiLogin,
} from "client/views/login/loginThunks";

export const KompassiLoginCallback = (): ReactElement => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      // Read and drop the state before branching: it has to be single use, so
      // a denied or abandoned login must not leave one behind that a later
      // callback could satisfy
      const expectedState = getKompassiLoginState();
      clearKompassiLoginState();

      if (code) {
        // The state is session-scoped, so only the tab that started the login
        // holds it: a mismatch means this callback answers a request we did
        // not make
        if (!expectedState || state !== expectedState) {
          await navigate(
            `${AppRoute.LOGIN}?error=${LoginErrorMessage.LOGIN_FAILED}`,
          );
          return;
        }

        const errorMessage = await dispatch(submitKompassiLogin(code));
        if (errorMessage) {
          await navigate(`${AppRoute.LOGIN}?error=${errorMessage}`);
          return;
        }
      }
      if (error) {
        await navigate(AppRoute.LOGIN);
        return;
      }
      await navigate(AppRoute.ROOT);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchData();
  }, [code, error, state, dispatch, navigate]);

  return <Loading />;
};
