import 'reflect-metadata';  // tslint:disable-line:no-import-side-effect ordered-imports - 'cuz to use ES7 Reflect API with tsyringe

// tslint:disable-next-line: ordered-imports - 'cus to place side effect imports at the beginning of the line
import { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { ChartConfiguration } from 'chart.js';
import dayjs from 'dayjs';
import hexToRgba from 'hex-rgba';
import { container } from 'tsyringe';
import { ulid } from 'ulid';
import { Config, Env } from '~/config';
import { AwsApi } from '~/external-api/aws';
import { Attachment, Message, SlackApi, SlashCommand } from '~/external-api/slack';
import { Geometry } from '~/external-api/yolp/common';
import { GeoCodeApi } from '~/external-api/yolp/geo-code';
import { AreaInfo, PlaceInfo, PlaceInfoApi } from '~/external-api/yolp/place-info';
import { StaticMapApi } from '~/external-api/yolp/static-map';
import { Weather, WeatherForecastApi } from '~/external-api/yolp/weather-forecast';
import { ZipCodeApi, ZipCodeRequest } from '~/external-api/yolp/zip-code';

const apis = {
  aws: container.resolve(AwsApi),
  slack: container.resolve(SlackApi),
  zip: container.resolve(ZipCodeApi),
  geo: container.resolve(GeoCodeApi),
  map: container.resolve(StaticMapApi),
  place: container.resolve(PlaceInfoApi),
  weather: container.resolve(WeatherForecastApi)
};


/**
 * Slack weather command's AWS Lambda function handler.
 *
 * @param event – API Gateway "event".
 * @see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
 * @see https://api.slack.com/slash-commands
 */
export const handler: Handler<APIGatewayProxyEvent, void> = async (event: APIGatewayProxyEvent): Promise<void> => {
  console.debug('Starting Lambda handler: event=%s', JSON.stringify(event));

  // tslint:disable-next-line: no-any - 'cus to parse non-JSON, JavaScript object literal like strings by Slack
  const command = event.body as any as SlashCommand;
  if (Env.SLACK_TOKENS.length !== 0 && !Env.SLACK_TOKENS.includes(command.token)) {
    return console.error('Forbidden: team=%s, command=%s', command.team_domain, JSON.stringify(command, undefined, 2));
  }

  try {
    const geo = await getGeometry(command.text);
    if (!geo) { return apis.slack.response(command, { text: `場所の検索に失敗しました。\`${command.command} [郵便番号 または 地名]\` を入力してください。` }); }

    const place = await getPlace(geo);
    const weathers = await getWeathers(geo);

    const filenames = Config.FILENAMES(geo, weathers.current);
    await Promise.all([
      apis.map.get(Config.REQUEST_MAP(geo)).then(async (value: Buffer) => {
        await apis.aws.s3PutObject(Env.S3_IMAGES_BUCKET, filenames.map, value, Config.CONTENT_TYPE_MAP);
      }),
      Config.CHART_CANVAS().renderToBuffer(createChartOps(weathers.data), Config.CONTENT_TYPE_CHART).then(async (value: Buffer) => {
        await apis.aws.s3PutObject(Env.S3_IMAGES_BUCKET, filenames.chart, value, Config.CONTENT_TYPE_CHART);
      })]
    );

    const message = createMessage(place, weathers, filenames);
    await apis.slack.response(command, message);
  } catch (err) { await handleError(err as object, command); }
};


const getGeometry = async (text: string): Promise<Geometry | undefined> => {
  const code = ZipCodeRequest.PATTERN_ZIP_CODE.exec(text);
  if (code) {
    const zip = await apis.zip.get(Config.REQUEST_ZIP(code[1]));
    return zip.Feature && Object.assign(new Geometry(), zip.Feature[0].Geometry);
  }
  const geo = await apis.geo.get(Config.REQUEST_GEO(text));
  return geo.Feature && Object.assign(new Geometry(), geo.Feature[0].Geometry);
};

interface Place { area: string; buildings: string; }  // tslint:disable-line: completed-docs - 'cuz internally used data model
const getPlace = async (geo: Geometry): Promise<Place> => {
  const place = await apis.place.get(Config.REQUEST_PLACE(geo));
  const areas = place.ResultSet.Area.filter((value: AreaInfo) => value.Type === 2);
  return {
    area: areas.length !== 0 ? areas[0].Name : place.ResultSet.Address[1],
    buildings: place.ResultSet.Result.map((value: PlaceInfo) => value.Name).join(', ')
  };
};

interface Weathers { current: Weather; after1h: Weather; data: Weather[]; }  // tslint:disable-line: completed-docs - 'cuz internally used data model
const getWeathers = async (geo: Geometry): Promise<Weathers> => {
  const data = (await apis.weather.get(Config.REQUEST_WEATHER(geo))).Feature[0].Property.WeatherList.Weather;
  return {
    current: data[0],
    after1h: data.slice(-1)[0],
    data
  };
};

const createChartOps = (weathers: Weather[]): ChartConfiguration => {
  const data = weathers.map((value: Weather) => value.Rainfall);
  const borderColor = createChartColor(weathers, Config.ALPHA_BORDER);
  const backgroundColor = createChartColor(weathers, Config.ALPHA_BACKGROUND);
  return {
    type: 'bar',
    data: {
      labels: weathers.map((value: Weather) => dayjs(value.Date).format('H:mm')),
      datasets: [{ data, borderColor, backgroundColor }]
    },
    options: {
      legend: { display: false },
      scales: { yAxes: [{ ticks: { beginAtZero: true }}]}
    }
  };
};
const createChartColor = (weathers: Weather[], opacity: number): string[] =>
  weathers.map((value: Weather) => hexToRgba(WeatherForecastApi.getLevelColor(value.Rainfall), opacity));


interface Filenames { map: string; chart: string; }  // tslint:disable-line: completed-docs - 'cuz internally used data model
const createMessage = ({ area, buildings }: Place, {current, after1h }: Weathers, filenames: Filenames): Message => {
  const icon = current.Rainfall === 0 ? '☀️' : current.Rainfall < 4 ? '🌦️' : '🌧️';
  const rain = `${dayjs(current.Date).format('H:mm')} の 降水強度 ${current.Rainfall} mm/h ⇒ ${after1h.Rainfall} mm/h`;
  const info = `🏙 ${ buildings.length < Config.SLACK_INFO_TEXT_LENGTH ? buildings : buildings.slice(0, Config.SLACK_INFO_TEXT_LENGTH)}...`;
  const map  = `<http://${Env.S3_IMAGES_BUCKET}.s3-website-${Env.S3_IMAGES_REGION}.amazonaws.com/${filenames.map}?${ulid()}| >`;

  const message: Message = {
    text: `${icon} ${area} ${rain}\n${info}${map}`,
    response_type: 'in_channel'
  };
  console.debug('Reply: %s', JSON.stringify(message, undefined, 2));
  return message;
};


const handleError = async (err: object, command: SlashCommand): Promise<void> => {
  console.error(err);
  const attachments: Attachment[] = [];
  if (err instanceof Error && Env.STAGE === 'dev') {
    attachments.push({ text: err.stack });
  }
  await apis.slack.response(command, { text: 'エラーが発生しました。', attachments });
};
