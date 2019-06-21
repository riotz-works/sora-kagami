import 'reflect-metadata';  // tslint:disable-line:no-import-side-effect ordered-imports - 'cuz to use ES7 Reflect API with tsyringe

// tslint:disable-next-line: ordered-imports - 'cus to place side effect imports at the beginning of the line
import { APIGatewayProxyEvent, Handler } from 'aws-lambda';
import { container } from 'tsyringe';
import { Config, Env } from '~/config';
import { Attachment, Message, SlackApi, SlashCommand } from '~/external-api/slack';
import { Geometry } from '~/external-api/yolp/common';
import { GeoCodeApi } from '~/external-api/yolp/geo-code';
import { AreaInfo, PlaceInfo, PlaceInfoApi } from '~/external-api/yolp/place-info';
import { ZipCodeApi, ZipCodeRequest } from '~/external-api/yolp/zip-code';

const apis = {
  slack: container.resolve(SlackApi),
  zip: container.resolve(ZipCodeApi),
  geo: container.resolve(GeoCodeApi),
  place: container.resolve(PlaceInfoApi)
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

    const message = createMessage(place);
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


const createMessage = ({ area, buildings }: Place): Message => {
  const info = `🏙 ${ buildings.length < Config.SLACK_INFO_TEXT_LENGTH ? buildings : buildings.slice(0, Config.SLACK_INFO_TEXT_LENGTH)}...`;

  const message: Message = {
    text: `${area}\n${info}`,
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
