import { injectable } from 'tsyringe';
import { AxiosHttpClient } from '~/external-api/axios';


/**
 * YOLP Static map APIs.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/static.html
 */
@injectable()
export class StaticMapApi {

  private static readonly URL = 'https://map.yahooapis.jp/map/V1/static';

  public constructor(private readonly client: AxiosHttpClient) {}


  /**
   * Get static map image data.
   * @param params Request parameter.
   */
  public async get(params: StaticMapRequest): Promise<Buffer> {
    return (await this.client.stream(StaticMapApi.URL, params)).data;
  }
}


// tslint:disable: completed-docs variable-name - 'cuz model definition of external API, for details refer to the official document
/**
 * Request parameter of YOLP StaticMap API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/static.html#request-param
 */
export class StaticMapRequest {

  public appid!: string;

  public lon?: number;
  public lat?: number;
  public z?: number;
  public mode?: 'map' | 'photo' | 'map-b1' | 'hd' | 'hybrid' | 'blankmap' | 'osm';

  public width?: 500 | number;
  public height?: 500 | number;
  public dx?: 0 | number;
  public dy?: 0 | number;

  public scalebar?: 'on' | 'off' | 'ur' | 'ul' | 'dr' | 'dl' | string;
  public pin?: string;
  public l?: string;
  public p?: string;
  public e?: string;
  public bbox?: string;
  public pointer?: 'on' | 'off';

  public datum?: 'wgs' | 'tky';
  public autoscale?: 'on' | 'off';
  public maxzoom?: number;
  public icon_label?: 'on' | 'off';
  public icon_label_size?: 12 | number;
  public icon_label_len?: 0 | number;

  public url?: string;
  public view?: 'normal' | 'heatmap';
  public icon_num?: 'off' | 'on';

  public style?: string;
  public overlay?: string;

  public quality?: 90 | number;
  public output?: 'png' | 'png32' | 'gif' | 'jpg' | 'jpeg' | 'xml' = 'png32';
}
