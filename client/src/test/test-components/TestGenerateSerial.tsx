import { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { first } from "remeda";
import { Button, ButtonStyle } from "client/components/Button";
import { postAddSerials } from "client/test/test-data/testDataServices";

// Dev helper for testing the registration flow: generates a valid
// registration code without running the generate-serials script
export const TestGenerateSerial = (): ReactElement => {
  const { t } = useTranslation();
  const [serial, setSerial] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const generateSerial = async (): Promise<void> => {
    setLoading(true);
    const response = await postAddSerials(1);
    setLoading(false);

    if (response.status === "error") {
      return;
    }

    setSerial(first(response.serials) ?? null);
  };

  return (
    <div>
      <StyledButton
        buttonStyle={ButtonStyle.SECONDARY}
        disabled={loading}
        onClick={async () => {
          await generateSerial();
        }}
      >
        {t("testValues.generateSerial")}
      </StyledButton>
      {serial && <SerialCode>{serial}</SerialCode>}
    </div>
  );
};

// The fixed test-value container has pointer-events: none so it doesn't
// block the header underneath; interactive children opt back in
const StyledButton = styled(Button)`
  pointer-events: auto;
`;

const SerialCode = styled.div`
  font-size: 20px;
  color: ${(props) => props.theme.textError};
  width: fit-content;
  pointer-events: auto;
`;
