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
    logRetentionInDays: 7
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
    }
  },

  functions: {}
};
