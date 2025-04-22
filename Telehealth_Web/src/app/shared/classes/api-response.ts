export interface IResponse<T> {
  status: boolean;
  data: T;
  body: T;
  message: string;
  errorCode?: string | null;
}
export interface IEncryptedResponse<T> {
  data: T;
}
