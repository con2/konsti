import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import moment from 'moment-timezone';
import 'regenerator-runtime/runtime';
import 'test/i18nTest';

configure({ adapter: new Adapter() });

moment.tz.setDefault('UTC');
