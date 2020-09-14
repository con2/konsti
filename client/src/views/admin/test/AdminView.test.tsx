import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { AdminView } from '../AdminView';

describe('AdminView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <AdminView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
