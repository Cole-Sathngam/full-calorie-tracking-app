#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CalorieApiInfrastructureStackV2 } from '../lib/calorie-api-infrastructure-stack-v2';

const app = new cdk.App();

new CalorieApiInfrastructureStackV2(app, 'CalorieApiInfrastructureStackV2', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
});

app.synth(); 