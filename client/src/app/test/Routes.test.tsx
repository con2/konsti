import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { Routes, Props } from 'app/Routes';

const onlyAdminLoginAllowed = false;

describe('Routes', () => {
  it('should render correctly', () => {
    const props: Props = { onlyAdminLoginAllowed };
    const component = shallow(
      <Provider store={store}>
        <Routes {...props} />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
