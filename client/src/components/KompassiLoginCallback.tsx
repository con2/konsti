import { ReactElement, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { submitKompassiLogin } from "client/views/login/loginThunks";
import { useAppDispatch } from "client/utils/hooks";
import { Loading } from "client/components/Loading";
import { AppRoute } from "client/app/AppRoutes";

export const KompassiLoginCallback = (): ReactElement => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  const error = searchParams.get("error");

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (code) {
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
  }, [code, error, dispatch, navigate]);

  return <Loading />;
};
