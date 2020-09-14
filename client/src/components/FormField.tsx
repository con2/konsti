import React, { FC, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { WrappedFieldProps } from 'redux-form';

interface CustomFieldProps {
  type?: string;
}

export const FormField: FC<WrappedFieldProps & CustomFieldProps> = (
  props: WrappedFieldProps & CustomFieldProps
): ReactElement => {
  const { type } = props;
  const { name, onChange, onBlur, onDragStart, onDrop, onFocus } = props.input;
  const { touched, error } = props.meta;
  const { t } = useTranslation();

  const [fieldType, setFieldType] = React.useState<string>('');

  React.useEffect(() => {
    setFieldType(type ?? 'text');
  }, [type]);

  const classNames = ['form-input'];

  if (type === 'checkbox') {
    classNames.push('checkbox');
  }

  const togglePasswordVisibility = (): void => {
    if (fieldType === 'password') setFieldType('text');
    else if (fieldType === 'text') setFieldType('password');
  };

  return (
    <>
      <FormRow>
        <StyledFormField>
          <StyledInput
            className={classNames.join(' ')}
            id={name}
            name={name}
            onBlur={onBlur}
            onChange={onChange}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onFocus={onFocus}
            placeholder={t(name)}
            type={fieldType}
          />
          {type === 'checkbox' && <label htmlFor={name}>{t(name)}</label>}
        </StyledFormField>

        {type === 'password' && (
          <FormFieldIcon>
            <FontAwesomeIcon
              icon={fieldType === 'password' ? 'eye' : 'eye-slash'}
              onClick={togglePasswordVisibility}
            />
          </FormFieldIcon>
        )}
      </FormRow>

      {touched && error && (
        <FormFieldError>
          <FormFieldErrorMessage>{t(error)}</FormFieldErrorMessage>
        </FormFieldError>
      )}
    </>
  );
};

const FormRow = styled.div`
  align-items: center;
  display: flex;
  flex: 0 1 auto;
  flex-direction: row;
  width: 50%;
  justify-content: flex-start;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    width: 100%;
  }
`;

const StyledFormField = styled.div`
  align-items: center;
  display: flex;
  flex: 0 1 auto;
  flex-direction: row;
  padding: 8px 0;
  width: 80%;
`;

const FormFieldIcon = styled.span`
  padding: 0 0 0 8px;
  font-size: ${(props) => props.theme.iconSize};
`;

const FormFieldError = styled.div`
  display: flex;
  background-color: ${(props) => props.theme.backgroundHighlight};
  color: ${(props) => props.theme.error};
  width: 50%;

  @media (max-width: ${(props) => props.theme.breakpointPhone}) {
    width: 100%;
  }
`;

const FormFieldErrorMessage = styled.span`
  padding: 4px 0 4px 10px;
`;

const StyledInput = styled.input`
  &.form-input {
    border: 1px solid ${(props) => props.theme.borderInactive};
    color: ${(props) => props.theme.buttonText};
    height: 34px;
    padding: 0 0 0 10px;
    width: 100%;
  }

  &.checkbox {
    margin-right: 10px;
    width: 16px;
  }
`;
