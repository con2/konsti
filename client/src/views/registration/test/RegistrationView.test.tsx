import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { RegistrationView } from '../RegistrationView';

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
