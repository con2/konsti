import React from 'react';
import { render } from '@testing-library/react';
import { WrappedFieldProps } from 'redux-form';
import { FormField } from 'client/components/FormField';
import { store } from 'client/utils/store';

const props: WrappedFieldProps = {
  meta: {
    active: false,
    asyncValidating: false,
    autofilled: false,
    dirty: false,
    // @ts-expect-error Type 'AnyAction' is not assignable to type 'T'.
    dispatch: () => store.dispatch(''),
    error: 'validation.required',
    form: 'registration',
    initial: undefined,
    invalid: true,
    pristine: true,
    submitFailed: true,
    submitting: false,
    touched: true,
    valid: false,
    visited: false,
    warning: undefined,
  },
  input: {
    name: 'password',
    value: '',
    onBlur: () => {},
    onChange: () => {},
    onDragStart: () => {},
    onDrop: () => {},
    onFocus: () => {},
  },
};

test('should render correctly', () => {
  render(<FormField {...props} />);
});
