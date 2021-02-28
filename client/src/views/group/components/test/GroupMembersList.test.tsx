import React from 'react';
import { shallow } from 'enzyme';
import { GroupMember } from 'client/typings/group.typings';
import {
  GroupMembersList,
  Props,
} from 'client/views/group/components/GroupMembersList';

const groupMembers: GroupMember[] = [];

describe('GroupMembersList', () => {
  it('should render correctly', () => {
    const props: Props = { groupMembers };
    const component = shallow(<GroupMembersList {...props} />);
    expect(component).toMatchSnapshot();
  });
});
