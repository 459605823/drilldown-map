/* eslint max-classes-per-file:0 */
interface Options {
  type?: string;
  message?: string;
  data?: any;
}
export class RuntimeException {
  private _message?: string;

  private _type?: string;

  private _data?: any;

  constructor(options: Options = {}) {
    const {type, message, data} = options;
    this._type = type;
    this._message = message || type;
    this._data = data;
  }

  name = 'RuntimeException';

  get message() {
    return this._message;
  }

  get data() {
    return this._data;
  }

  get type() {
    return this._type;
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}

export class IllegalStateException extends RuntimeException {
  name = 'IllegalStateException';
}

export class InvalidArgumentException extends RuntimeException {
  name = 'InvalidArgumentException';
}

export class NotImplementedException extends RuntimeException {
  name = 'NotImplementedException';
}
