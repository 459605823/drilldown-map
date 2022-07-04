export default (promise: Promise<any>, ext = {}) =>
  promise
    .then((res) => ({
      err: null,
      res,
      ...ext,
    }))
    .catch((err) => ({err, res: undefined, ...ext}));
