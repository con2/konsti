import React from 'react';
import { shallow } from 'enzyme';
import { WrappedFieldProps } from 'redux-form';
import { FormField } from 'components/FormField';
import { store } from 'utils/store';

describe('FormField', () => {
  it('should render correctly', () => {
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
    const component = shallow(<FormField {...props} />);
    expect(component).toMatchSnapshot();
  });
});
