import {rest} from 'msw';

export default [
  rest.post('/login', (req, res, ctx) => {
    return res(
      ctx.json({
        code: 0,
        data: {
          id: 'f79e82e8-c34a-4dc7-a49e-9fadc0979fda',
        },
      })
    );
  }),
];
