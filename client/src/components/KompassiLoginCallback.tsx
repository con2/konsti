import { ReactElement, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { getKompassiLoginCallback } from "client/services/loginServices";

export const KompassiLoginCallback = (): ReactElement<typeof Navigate> => {
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (code) {
        await getKompassiLoginCallback(code);
      }
    };
    fetchData();
  });

  return <Navigate to="/" replace />;
};
