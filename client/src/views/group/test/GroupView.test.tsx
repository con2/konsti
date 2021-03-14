import React from 'react';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import { store } from 'client/utils/store';
import { GroupView } from 'client/views/group/GroupView';

describe('GroupView', () => {
  it('should render correctly', () => {
    const component = shallow(
      <Provider store={store}>
        <GroupView />
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
