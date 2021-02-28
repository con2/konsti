import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { RegistrationView } from 'client/views/registration/RegistrationView';

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
