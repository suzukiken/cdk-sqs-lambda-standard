#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdksqsLambdaStandardStack } from '../lib/cdksqs-lambda-standard-stack';
import { CdksqsLambdaStandardBatchStack } from '../lib/cdksqs-lambda-standard-batch-stack';
import { CdksqsLambdaStandardConcStack } from '../lib/cdksqs-lambda-standard-conc-stack';
import { CdksqsLambdaStandardMixedStack } from '../lib/cdksqs-lambda-standard-mixed-stack';

const app = new cdk.App();
new CdksqsLambdaStandardStack(app, 'CdksqsLambdaStandardStack');
new CdksqsLambdaStandardBatchStack(app, 'CdksqsLambdaStandardBatchStack');
new CdksqsLambdaStandardConcStack(app, 'CdksqsLambdaStandardConcStack');
new CdksqsLambdaStandardMixedStack(app, 'CdksqsLambdaStandardMixedStack');