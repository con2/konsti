import React from 'react';
import { Provider } from 'react-redux';
import { store } from 'utils/store';
import { shallow } from 'enzyme';
import { GroupView } from '../GroupView';

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
