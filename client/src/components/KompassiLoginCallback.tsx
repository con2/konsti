import { ReactElement, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { submitKompassiLogin } from "client/views/login/loginThunks";
import { useAppDispatch } from "client/utils/hooks";

export const KompassiLoginCallback = (): ReactElement => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (code) {
        const errorMessage = await dispatch(submitKompassiLogin(code));
        if (errorMessage) {
          navigate(`/login?error=${errorMessage}`);
          return;
        }
        navigate(`/`);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div />;
};
