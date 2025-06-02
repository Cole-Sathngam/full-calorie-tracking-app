#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CalorieApiInfrastructureStack } from '../lib/calorie-api-infrastructure-stack';

const app = new cdk.App();

new CalorieApiInfrastructureStack(app, 'CalorieApiInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-2',
  },
});

app.synth(); 