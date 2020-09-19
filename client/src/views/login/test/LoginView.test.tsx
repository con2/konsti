import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { LoginView } from '../LoginView';

describe('LoginView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <LoginView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
