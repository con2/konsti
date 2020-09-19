import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { LogoutView } from '../LogoutView';

describe('LogoutView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <LogoutView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
