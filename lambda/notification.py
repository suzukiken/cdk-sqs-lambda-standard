def lambda_handler(event, context):
    for record in event['Records']:
        if record['eventSource'] == "aws:sqs":
            print('action:rejected:{}'.format(record['body']))