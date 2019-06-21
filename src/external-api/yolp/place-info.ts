import { injectable } from 'tsyringe';
import { AxiosHttpClient } from '~/external-api/axios';
import { Country } from '~/external-api/yolp/common';


/**
 * YOLP Place information APIs.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/placeinfo.html
 */
@injectable()
export class PlaceInfoApi {

  private static readonly URL = 'https://map.yahooapis.jp/placeinfo/V1/get';

  public constructor(private readonly client: AxiosHttpClient) {}


  /**
   * Get place information.
   * @param params Request parameter.
   */
  public async get(params: PlaceInfoRequest): Promise<PlaceInfoResponse> {
    if (!params.output) { params.output = 'json'; }
    const data = (await this.client.get<PlaceInfoResponse>(PlaceInfoApi.URL, params)).data;
    console.debug('PlaceInfoApi: %s', JSON.stringify(data, undefined, 2));
    return data;
  }
}


// tslint:disable: completed-docs - 'cuz model definition of external API, for details refer to the official document
/**
 * Request parameter of YOLP Place information API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/placeinfo.html#request-param
 */
export class PlaceInfoRequest {

  public appid!: string;
  public lon!: number;
  public lat!: number;

  public output?: 'xml' | 'json' = 'json';
  public callback?: string;
}

/**
 * Response fields of YOLP Place information API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/placeinfo.html#response_field
 */
export interface PlaceInfoResponse {
  ResultSet: {
    Address: string[];
    Govcode: string;
    Country: Country;
    Roadname: string;
    Result: PlaceInfo[];
    Area: AreaInfo[];
  };
}

export interface PlaceInfo {
  Uid: string;
  Name: string;
  Category: string;
  Label: string;
  Where: string;
  Combined: string;
  Score: number;
}

export interface AreaInfo {
  Id: string;
  Name: string;
  Type: 1 | 2;
  Score: number;
}
