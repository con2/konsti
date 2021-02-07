import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { RegistrationView } from 'views/registration/RegistrationView';

describe('RegistrationView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <RegistrationView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
