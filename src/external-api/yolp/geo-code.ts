import { injectable } from 'tsyringe';
import { AxiosHttpClient } from '~/external-api/axios';
import { AddressElement, Geometry } from '~/external-api/yolp/common';


/**
 * YOLP Contents geo coder APIs.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/contentsgeocoder.html
 */
@injectable()
export class GeoCodeApi {

  private static readonly URL = 'https://map.yahooapis.jp/geocode/cont/V1/contentsGeoCoder';

  public constructor(private readonly client: AxiosHttpClient) {}


  /**
   * Get geo code information.
   * @param params Request parameter.
   */
  public async get(params: GeoCodeRequest): Promise<GeoCodeResponse> {
    if (!params.output) { params.output = 'json'; }
    const { data } = await this.client.get<GeoCodeResponse>(GeoCodeApi.URL, { ...params });
    console.debug('GeoCodeApi: %s', JSON.stringify(data, undefined, 2));
    return data;
  }
}


/**
 * Request parameter of YOLP Contents geo coder API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/contentsgeocoder.html#request-param
 */
export class GeoCodeRequest {

  public appid!: string;
  public query!: string;

  public ei?: 'UTF-8' | 'EUC-JP' | 'SJIS';
  public category?: 'address' | 'landmark' | 'world' | string;

  public results?: 10 | number;
  public output?: 'xml' | 'json' = 'json';
  public callback?: string;
}

/**
 * Response fields of YOLP Contents geo coder API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/contentsgeocoder.html#response_field
 */
export interface GeoCodeResponse {
  ResultInfo: {
    Count: number;
    Total: number;
    Start: number;
    Status: number;
    Latency: number;
    Description: string;
    Copyright: string;
    CompressType: string;
  };
  Feature?: GeoCodeFeature[];
}

export interface GeoCodeFeature {
  Id: number;
  Name: string;
  Geometry: Geometry;
  Description: string;
  Property: {
    Query: string;
    Genre: string;
    Address: string;
    AddressKana: string;
    AddressElement: AddressElement[];
  };
}
