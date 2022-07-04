/* eslint-disable no-redeclare */
import ky, {AfterResponseHook, Options} from 'ky';
import {IllegalStateException} from '@/utils/exception';
import to from '@/utils/to';

type Input = string | URL | Request;

const afterResponse: AfterResponseHook[] = [
  async (request, options, response) => {
    if (response.ok) {
      const payload = await response.json();
      if (payload.code !== 0) {
        console.error(payload.msg);
        throw new IllegalStateException({
          type: 'RESPONSE_ERROR',
          data: payload,
        });
      } else {
        return new Response(JSON.stringify(payload.data), {status: 200});
      }
    }
  },
];

const ky_ = ky.create({
  prefixUrl: '/',
  credentials: 'include',
  cache: 'no-store',
  mode: 'cors',
  retry: 0,
  hooks: {
    afterResponse,
  },
});

type Method = Exclude<Options['method'], undefined | object>;

const getAction = (method: Method = 'get') => {
  function Action(
    url: Input,
    options?: Options
  ): Promise<{
    err?: any;
    res?: any;
  }>;

  function Action<P extends object>(
    url: Input,
    options?: Options
  ): Promise<{
    err?: any;
    res: P;
  }>;

  async function Action(url: Input, options: Options = {}) {
    const {searchParams} = options;
    if (
      searchParams &&
      !Array.isArray(searchParams) &&
      typeof searchParams !== 'string' &&
      searchParams.constructor !== URLSearchParams
    ) {
      (Object.keys(searchParams) as (keyof typeof searchParams)[]).forEach(
        (key) => {
          if (searchParams[key] === undefined) {
            delete searchParams[key];
          }
        }
      );
    }
    const {err, res} = await to(ky_(url, {...options, method}));
    if (!err) {
      const payload = await res.json();
      return {
        res: payload,
      };
    }
    return {err};
  }
  return Action;
};
const get = getAction();

type Api = Record<Method, typeof get> & {
  mock: (state: boolean) => void;
};

const api = Object.create(null) as Api;

const requestMethods = [
  'get',
  'post',
  'put',
  'patch',
  'head',
  'delete',
] as const;

requestMethods.forEach((method) => {
  api[method] = getAction(method);
});

api.mock = (state) => {
  if (process.env.NODE_ENV === 'development' && state) {
    try {
      const worker = require('../mocks/browser').default;
      worker.start();
    } catch (error) {
      console.log(error);
    }
  }
};

export default api;
