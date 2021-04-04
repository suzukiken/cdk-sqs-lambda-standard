import * as cdk from "@aws-cdk/core";
import * as sqs from "@aws-cdk/aws-sqs";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { PythonFunction } from "@aws-cdk/aws-lambda-python";

export class CdksqsLambdaStandardMrc1BatchStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const PREFIX_NAME = id.toLowerCase().replace("stack", "")
    
    // notification for dead letter queue
    
    const notification_function = new PythonFunction(this, "notification_function", {
      entry: "lambda",
      index: "notification.py",
      handler: "lambda_handler",
      functionName: PREFIX_NAME + "-notification",
      runtime: lambda.Runtime.PYTHON_3_8,
    });
    
    // DLQ and its lambda which will be triggered by dlq
    
    const dead_letter_queue = new sqs.Queue(this, "dead_letter_queue", {
      queueName: PREFIX_NAME + "-dlq",
      retentionPeriod: cdk.Duration.minutes(60),
    });
    
    notification_function.addEventSource(
      new SqsEventSource(dead_letter_queue)
    );

    dead_letter_queue.grantConsumeMessages(notification_function);
    
    // queue

    const queue = new sqs.Queue(this, "queue", {
      queueName: PREFIX_NAME,
      retentionPeriod: cdk.Duration.minutes(10),
      visibilityTimeout: cdk.Duration.seconds(15),
      deadLetterQueue: {
        maxReceiveCount: 1, 
        queue: dead_letter_queue,
      },
    });
    
    // activate Lambda Insight

    const role = new iam.Role(this, "role", {
      roleName: PREFIX_NAME + "-role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLambdaInsightsExecutionRolePolicy")
      ]
    })
    
    const layer = lambda.LayerVersion.fromLayerVersionArn(this, "layer", 
      "arn:aws:lambda:ap-northeast-1:580247275435:layer:LambdaInsightsExtension:14"
    );

    const lambda_function = new PythonFunction(this, "lambda_function", {
      entry: "lambda",
      index: "consumer.py",
      handler: "lambda_handler",
      functionName: PREFIX_NAME,
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(2),
      role: role,
      layers: [ layer ], // add Lambda Insight
      tracing: lambda.Tracing.ACTIVE // activate X-Ray
    });

    lambda_function.addEventSource(
      new SqsEventSource(queue, { batchSize: 1 })
    );

    queue.grantConsumeMessages(lambda_function);
    
    new cdk.CfnOutput(this, "output", {
      value: queue.queueName
    })
  }
}
