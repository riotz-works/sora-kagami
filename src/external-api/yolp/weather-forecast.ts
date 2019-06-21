import { injectable } from 'tsyringe';
import { AxiosHttpClient } from '~/external-api/axios';
import { Geometry } from '~/external-api/yolp/common';


/**
 * YOLP Weather forecast APIs.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/weather.html
 */
@injectable()
export class WeatherForecastApi {

  private static readonly URL = 'https://map.yahooapis.jp/weather/V1/place';

  public constructor(private readonly client: AxiosHttpClient) {}


  /**
   * Get weather forecast data.
   * @param params Request parameter.
   */
  public async get(params: WeatherForecastRequest): Promise<WeatherForecastResponse> {
    if (!params.output) { params.output = 'json'; }
    const data = (await this.client.get<WeatherForecastResponse>(WeatherForecastApi.URL, params)).data;
    console.debug('WeatherForecastApi: %s', JSON.stringify(data, undefined, 2));
    return data;
  }

  /**
   * Get display color hex code of precipitation intensity.
   * @param rainfall Precipitation intensity.
   */
  public static getLevelColor = (rainfall: Rainfall): string => {
    if (rainfall < 1) { return '#cff'; }
    if (rainfall < 2) { return '#6ff'; }
    if (rainfall < 4) { return '#0cf'; }
    if (rainfall < 8) { return '#09f'; }
    if (rainfall < 12) { return '#36f'; }
    if (rainfall < 16) { return '#3f0'; }
    if (rainfall < 24) { return '#3c0'; }
    if (rainfall < 32) { return '#199900'; }
    if (rainfall < 40) { return '#ff0'; }
    if (rainfall < 48) { return '#fc0'; }
    if (rainfall < 56) { return '#f90'; }
    if (rainfall < 64) { return '#ff5066'; }
    if (rainfall < 80) { return 'red'; }
    return '#b70014';
  }
}


// tslint:disable: completed-docs - 'cuz model definition of external API, for details refer to the official document
/**
 * Request parameter of YOLP Weather forecast API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/weather.html#request-param
 */
export class WeatherForecastRequest {

  public appid!: string;
  public coordinates!: string;

  public date?: string;
  public past?: 0 | 1 | 2;
  public interval?: 10 | 5;

  public output?: 'xml' | 'json' = 'json';
  public callback?: string;
}

/**
 * Response fields of YOLP Weather forecast API.
 * @see https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/weather.html#response_field
 */
export interface WeatherForecastResponse {
  ResultInfo: {
    Count: number;
    Total: number;
    Start: number;
    Status: number;
    Latency: number;
    Description: string;
    Copyright: string;
  };
  Feature: WeatherFeature[];
}

export interface WeatherFeature {
  Id: string;
  Name: string;
  Geometry: Geometry;
  Property: {
    WeatherAreaCode: number;
    WeatherList: {
      Weather: Weather[];
    };
  };
}

export interface Weather {
  Type: 'observation ' | 'forecast ';
  Date: string;
  Rainfall: Rainfall;
}

export type Rainfall = number;
