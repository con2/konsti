import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'utils/store';
import { LogoutView } from 'views/logout/LogoutView';

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
