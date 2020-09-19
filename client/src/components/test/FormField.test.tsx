import React from 'react';
import { shallow } from 'enzyme';
import { WrappedFieldProps } from 'redux-form';
import { FormField } from '../FormField';
import { store } from 'utils/store';

describe('FormField', () => {
  it('should render correctly', () => {
    const props: WrappedFieldProps = {
      meta: {
        active: false,
        asyncValidating: false,
        autofilled: false,
        dirty: false,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
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
