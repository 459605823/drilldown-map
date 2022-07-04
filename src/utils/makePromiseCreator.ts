import to from './to';

export default (useto = false, ext = {}) => {
  const promise = {} as {
    promise: Promise<any>;
    resolve: (value?: any) => void;
    reject: (value?: any) => void;
  };
  promise.promise = new Promise((resolve, reject) => {
    promise.resolve = resolve;
    promise.reject = reject;
  });
  if (useto) {
    promise.promise = to(promise.promise, ext);
  }
  return promise;
};
