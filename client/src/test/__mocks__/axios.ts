import axios from 'axios';

const mockAxios: jest.Mocked<typeof axios> = jest.createMockFromModule('axios');
mockAxios.create = jest.fn(() => mockAxios);

/* eslint-disable-next-line import/no-unused-modules */
export default mockAxios;
