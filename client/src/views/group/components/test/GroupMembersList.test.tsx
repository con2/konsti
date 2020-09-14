import React from 'react';
import { shallow } from 'enzyme';
import { GroupMembersList, Props } from '../GroupMembersList';
import { GroupMember } from 'typings/group.typings';

const groupMembers: GroupMember[] = [];

describe('GroupMembersList', () => {
  it('should render correctly', () => {
    const props: Props = { groupMembers };
    const component = shallow(<GroupMembersList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
