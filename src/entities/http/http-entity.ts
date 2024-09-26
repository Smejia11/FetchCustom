export class HttpErrorCodes {
  static readonly BadRequest: number = 400;
  static readonly Unauthorized: number = 401;
  static readonly PaymentRequired: number = 402;
  static readonly Forbidden: number = 403;
  static readonly NotFound: number = 404;
  static readonly MethodNotAllowed: number = 405;
  static readonly NotAcceptable: number = 406;
  static readonly ProxyAuthenticationRequired: number = 407;
  static readonly RequestTimeout: number = 408;
  static readonly Conflict: number = 409;
  static readonly Gone: number = 410;
  static readonly LengthRequired: number = 411;
  static readonly PreconditionFailed: number = 412;
  static readonly PayloadTooLarge: number = 413;
  static readonly URITooLong: number = 414;
  static readonly UnsupportedMediaType: number = 415;
  static readonly RangeNotSatisfiable: number = 416;
  static readonly ExpectationFailed: number = 417;
  static readonly ImATeapot: number = 418; // Easter egg HTTP status
  static readonly MisdirectedRequest: number = 421;
  static readonly UnprocessableEntity: number = 422;
  static readonly Locked: number = 423;
  static readonly FailedDependency: number = 424;
  static readonly TooEarly: number = 425;
  static readonly UpgradeRequired: number = 426;
  static readonly PreconditionRequired: number = 428;
  static readonly TooManyRequests: number = 429;
  static readonly RequestHeaderFieldsTooLarge: number = 431;
  static readonly UnavailableForLegalReasons: number = 451;

  // Server Errors
  static readonly InternalServerError: number = 500;
  static readonly NotImplemented: number = 501;
  static readonly BadGateway: number = 502;
  static readonly ServiceUnavailable: number = 503;
  static readonly GatewayTimeout: number = 504;
  static readonly HTTPVersionNotSupported: number = 505;
  static readonly VariantAlsoNegotiates: number = 506;
  static readonly InsufficientStorage: number = 507;
  static readonly LoopDetected: number = 508;
  static readonly NotExtended: number = 510;
  static readonly NetworkAuthenticationRequired: number = 511;
}
