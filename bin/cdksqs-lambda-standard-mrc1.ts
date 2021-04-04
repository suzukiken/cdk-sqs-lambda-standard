#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdksqsLambdaStandardMrc1Stack } from '../lib/cdksqs-lambda-standard-mrc1-stack';
import { CdksqsLambdaStandardMrc1BatchStack } from '../lib/cdksqs-lambda-standard-mrc1-batch-stack';
import { CdksqsLambdaStandardMrc1ConcStack } from '../lib/cdksqs-lambda-standard-mrc1-conc-stack';
import { CdksqsLambdaStandardMrc1MixedStack } from '../lib/cdksqs-lambda-standard-mrc1-mixed-stack';

const app = new cdk.App();
new CdksqsLambdaStandardMrc1Stack(app, 'CdksqsLambdaStandardMrc1Stack');
new CdksqsLambdaStandardMrc1BatchStack(app, 'CdksqsLambdaStandardMrc1BatchStack');
new CdksqsLambdaStandardMrc1ConcStack(app, 'CdksqsLambdaStandardMrc1ConcStack');
new CdksqsLambdaStandardMrc1MixedStack(app, 'CdksqsLambdaStandardMrc1MixedStack');