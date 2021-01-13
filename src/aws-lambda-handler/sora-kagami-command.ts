import 'reflect-metadata';
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const command = event.body as any as SlashCommand;
  if (Env.SLACK_TOKENS.length !== 0 && !Env.SLACK_TOKENS.includes(command.token)) {
    return console.error('Forbidden: team=%s, command=%s', command.team_domain, JSON.stringify(command, undefined, 2));
  }

  try {
    if (!command.text) { return apis.slack.response(command, { text: `場所が指定されていません。\`${command.command} [郵便番号 または 地名]\` を入力してください。` }); }

    const geo = await getGeometry(command.text);
    if (!geo) { return apis.slack.response(command, { text: `場所の検索に失敗しました。\`${command.command} [郵便番号 または 地名]\` を入力してください。` }); }

    const place = await getPlace(geo);
    const weathers = await getWeathers(geo);

    const filenames = Config.filenames(geo, weathers.current);
    await Promise.all([
      apis.map.get(Config.requestMap(geo)).then(async (value: Buffer) => {
        await apis.aws.s3PutObject(Env.S3_IMAGES_BUCKET, filenames.map, value, Config.CONTENT_TYPE_MAP);
      }),
      Config.chartCanvas().renderToBuffer(createChartOps(weathers.data), Config.CONTENT_TYPE_CHART).then(async (value: Buffer) => {
        await apis.aws.s3PutObject(Env.S3_IMAGES_BUCKET, filenames.chart, value, Config.CONTENT_TYPE_CHART);
      })
    ]);

    const message = createMessage(place, weathers, filenames, geo);
    await apis.slack.response(command, message);
  } catch (err) { await handleError(err as Record<string, unknown>, command); }
  return Promise.resolve();
};


const getGeometry = async (text: string): Promise<Geometry | undefined> => {
  const code = ZipCodeRequest.PATTERN_ZIP_CODE.exec(text);
  if (code && code.groups) {
    const zip = await apis.zip.get(Config.requestZip(code.groups.zip));
    return zip.Feature && Object.assign(new Geometry(), zip.Feature[0].Geometry);
  }
  const geo = await apis.geo.get(Config.requestGeo(text));
  return geo.Feature && Object.assign(new Geometry(), geo.Feature[0].Geometry);
};

interface Place { area: string; buildings: string }
const getPlace = async (geo: Geometry): Promise<Place> => {
  const place = await apis.place.get(Config.requestPlace(geo));
  const areas = place.ResultSet.Area.filter((value: AreaInfo) => value.Type === 2);
  return {
    area: areas.length !== 0 ? areas[0].Name : place.ResultSet.Address[1],
    buildings: place.ResultSet.Result.map((value: PlaceInfo) => value.Name).join(', ')
  };
};

interface Weathers { current: Weather; after1h: Weather; data: Weather[] }
const getWeathers = async (geo: Geometry): Promise<Weathers> => {
  const data = (await apis.weather.get(Config.requestWeather(geo))).Feature[0].Property.WeatherList.Weather;
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
const createChartColor = (weathers: Weather[], opacity: number): string[] => weathers.map((value: Weather) => hexToRgba(WeatherForecastApi.getLevelColor(value.Rainfall), opacity));


interface Filenames { map: string; chart: string }
const createMessage = ({ area, buildings }: Place, { current, after1h }: Weathers, filenames: Filenames, geo: Geometry): Message => {
  const icon = current.Rainfall === 0 ? '☀️' : current.Rainfall < 4 ? '🌦️' : '🌧️';
  const rain = `${dayjs(current.Date).format('H:mm')} の 降水強度 ${current.Rainfall} mm/h ⇒ ${after1h.Rainfall} mm/h`;
  const info = `🏙 ${buildings.length < Config.SLACK_INFO_TEXT_LENGTH ? buildings : buildings.slice(0, Config.SLACK_INFO_TEXT_LENGTH)}...`;

  const s3 = `https://${Env.S3_IMAGES_BUCKET}.s3-${Env.S3_IMAGES_REGION}.amazonaws.com`;
  const chart = `<${s3}/${filenames.chart}?${ulid()}| >`;
  const map   = `<${s3}/${filenames.map}?${ulid()}| >`;

  const yahoo = `<https://weather.yahoo.co.jp/weather/zoomradar/?lon=${geo.lon}&lat=${geo.lat}&z=13|ウェブで詳しく見る>`;
  const credit = `${yahoo}  -  <https://developer.yahoo.co.jp/about|Web Services by Yahoo! JAPAN>`;

  const project = `[<${Config.HOMEPAGE}|${Config.NAME} ${Config.VERSION}>]`;
  const note = Env.NOTE.replace('{project}', project);

  const message: Message = {
    text: `${icon} ${area} ${rain}\n${info}${chart}${map}${credit}\n${note}`,
    response_type: 'in_channel' /* eslint-disable-line camelcase */ // 'cuz to implement the specification of the external API of Slack
  };
  console.debug('Reply: %s', JSON.stringify(message, undefined, 2));
  return message;
};


const handleError = async (err: Record<string, unknown>, command: SlashCommand): Promise<void> => {
  console.error(err);
  const attachments: Attachment[] = [];
  if (err instanceof Error && Env.STAGE === 'dev') {
    attachments.push({ text: err.stack });
  }
  await apis.slack.response(command, { text: 'エラーが発生しました。', attachments });
};
