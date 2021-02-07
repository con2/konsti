import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { LoginView } from 'views/login/LoginView';

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
