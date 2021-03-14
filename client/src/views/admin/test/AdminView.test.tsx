import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { AdminView } from 'client/views/admin/AdminView';

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
