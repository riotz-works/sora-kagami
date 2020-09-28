import { injectable } from 'tsyringe';
import { AxiosHttpClient } from '~/external-api/axios';
import { AddressElement, Country, Geometry } from '~/external-api/yolp/common';


/**
 * YOLP ZipCode Search APIs.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/zipcodesearch.html
 */
@injectable()
export class ZipCodeApi {

  private static readonly URL = 'https://map.yahooapis.jp/search/zip/V1/zipCodeSearch';

  public constructor(private readonly client: AxiosHttpClient) {}


  /**
   * Get zip code information.
   * @param params Request parameter.
   */
  public async get(params: ZipCodeRequest): Promise<ZipCodeResponse> {
    if (!params.output) { params.output = 'json'; }
    const { data } = await this.client.get<ZipCodeResponse>(ZipCodeApi.URL, params);
    console.debug('ZipCodeApi: %s', JSON.stringify(data, undefined, 2));
    return data;
  }
}


/**
 * Request parameter of YOLP ZipCode Search API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/zipcodesearch.html#request-param
 */
export class ZipCodeRequest {

  public static readonly PATTERN_ZIP_CODE = /(?<zip>\d{3}-?\d{4}?)/gu;

  public appid!: string;

  public query?: string;
  public ac?: string;
  public sort?: 'zip_code' | '-zip_code' | 'zip_kana' | '-zip_kana';
  public zkind?: string;
  public detail?: 'standard' | 'simple' | 'full';

  public start?: 1 | number;
  public results?: 10 | number;
  public output?: 'xml' | 'json' = 'json';
  public callback?: string;
}

/**
 * Response fields of YOLP ZipCode Search API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/zipcodesearch.html#response_field
 */
export interface ZipCodeResponse {
  ResultInfo: {
    Count: number;
    Total: number;
    Start: number;
    Status: number;
    Latency: number;
    Description: string;
    Copyright: string;
  };
  Feature?: ZipCodeFeature[];
}

export interface ZipCodeFeature {
  Id: string;
  Gid: string;
  Name: string;
  Geometry: Geometry;
  Category: string[];
  Description: string;
  Style: string[];
  Property: {
    Uid: string;
    CassetteId: string;
    Country: Country;
    Address: string;
    AddressElement: AddressElement[];
    GovernmentCode: string;
    AddressMatchingLevel: string;
    PostalName: string;
    Station: Station[];
    OpenForBusiness: string;
    Detail: {
      PcUrl1: string;
    };
  };
}

export interface Station {
  Id: string;
  SubId: string;
  Name: string;
  Railway: string;
  Exit: string;
  ExitId: string;
  Distance: string;
  Time: string;
  Geometry: Geometry;
}
