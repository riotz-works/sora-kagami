import Axios, { AxiosInstance, AxiosResponse } from 'axios';


/**
 * Http Client by Axios.
 */
export class AxiosHttpClient {

  private readonly axios: AxiosInstance;

  public constructor() {
    this.axios = Axios.create({ timeout: 5000 });
  }


  /**
   * Request HTTP GET.
   *
   * @param url URL to send HTTP GET request.
   * @param params Request parameter.
   */
  public get<T>(url: string, params?: object): Promise<AxiosResponse<T>> {
    return this.axios.get<T>(url, { params });
  }

  /**
   * Request HTTP POST.
   *
   * @param url URL to send HTTP POST request.
   * @param data Request body.
   */
  public post<T>(url: string, data?: object): Promise<AxiosResponse<T>> {
    return this.axios.post<T>(url, data);
  }

  /**
   * Request HTTP GET for response type stream.
   *
   * @param url URL to send HTTP GET request.
   * @param params Request parameter.
   */
  public stream(url: string, params?: object): Promise<AxiosResponse<Buffer>> {
    return this.axios.get<Buffer>(url, { params, responseType: 'stream' });
  }
}
