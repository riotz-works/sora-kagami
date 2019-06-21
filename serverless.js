// Command line options
// --stage:       Required System Landscape name, default is 'dev' (Choice: [dev | qas | prd], e.g. --stage dev)
// --region:      Optional, default is determined by the value of `stage` (e.g. --region ap-northeast-1)
// --bucket:      Optional, default is determined by the value of `stage` (e.g. --bucket x-sls-artifacts)
// --aws-profile: Optional, when specifying AWS Profile name (If `dev` exists in `~/.aws/credentials`, e.g. --aws-profile dev )

const pkg = require('./package.json');


module.exports = {
  service: pkg.name,
  provider: {
    name: 'aws',
    stage: '${ opt:stage, "dev" }',
    region: '${ opt:region, self:custom.stages.region.${ self:provider.stage }}',
    deploymentBucket: {
      name: '${ opt:bucket, "x-sls-artifacts-' + pkg.group + '-${ self:provider.region }" }',
      serverSideEncryption: 'AES256'
    },
    apiName: '${ self:service }${ self:custom.stages.suffix.${ self:provider.stage }}',
    runtime: `nodejs${ pkg.engines.node }`,
    memorySize: 128,
    timeout: 29,
    logRetentionInDays: 7,
    iamRoleStatements: [{
      Effect: 'Allow',
      Action: [ 's3:PutObject' ],
      Resource: 'arn:aws:s3:::${self:custom.names.s3.images}/*'
    }],
    environment: {
      STAGE:            '${ self:provider.stage }',
      S3_IMAGES_REGION: '${ self:provider.region }',
      S3_IMAGES_BUCKET: '${ self:custom.names.s3.images }',
      SLACK_TOKENS:     '${ env:SLACK_TOKENS }',
      YOLP_APP_ID:      '${ env:YOLP_APP_ID }',
      NOTE:             '${ env:NOTE }'
    }
  },

  plugins: [
    'serverless-webpack',
    'serverless-offline'
  ],

  custom: {
    webpack: { packager: 'yarn', includeModules: { forceExclude: [ 'aws-sdk' ]}},
    stages: {
      region: { dev: 'ap-northeast-1', qas: '', prd: '' },
      suffix: { dev: '-dev',           qas: '', prd: '' }
    },
    names: {
      lambda: {
        systems:  '${ self:service }-systems${ self:custom.stages.suffix.${ self:provider.stage }}',
        weathers: '${ self:service }-weathers${ self:custom.stages.suffix.${ self:provider.stage }}'
      },
      s3: {
        images: '${ self:service }-images${ self:custom.stages.suffix.${ self:provider.stage }}'
      }
    }
  },

  functions: {
    Systems: {
      name: '${ self:custom.names.lambda.systems }',
      handler: 'src/aws-lambda-handler/systems.handler',
      events: [{ http: { path: 'version', method: 'get', cors: true }}]
    },
    Weathers: {
      name: '${ self:custom.names.lambda.weathers }',
      handler: 'src/aws-lambda-handler/slack-weathers-command.handler',
      events: [{ http: { path: 'weathers', method: 'post', cors: true, async: true }}]
    }
  },

  resources: [{
    Resources: {
      ImagesBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${ self:custom.names.s3.images }',
          BucketEncryption: { ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' }}]},
          AccessControl: 'Private',
          WebsiteConfiguration: {
            IndexDocument: 'index.html'
          },
          LifecycleConfiguration: {
            Rules: [{
              Id: 'expiration',
              Status: 'Enabled',
              ExpirationInDays: 3
            }]
          }
        }
      },
      ImagesBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: { 'Ref': 'ImagesBucket' },
          PolicyDocument: {
            Statement: {
              Effect: 'Allow',
              Action: [ 's3:GetObject' ],
              Resource: 'arn:aws:s3:::${ self:custom.names.s3.images }/*',
              Principal: '*'
            }
          }
        }
      }
    }
  }]
};
