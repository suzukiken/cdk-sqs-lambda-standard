import boto3
import uuid
from datetime import datetime
import sys

client = boto3.client('s3')
sts = boto3.client('sts')

caller_identity = sts.get_caller_identity()
account = caller_identity['Account']

QUEUE_GROUP_ID = '1'

sqs = boto3.resource('sqs')

def main(args):
    
    QUEUE_NAME = args[1]
    print(QUEUE_NAME)

    QUEUE_URL = 'https://sqs.ap-northeast-1.amazonaws.com/{}/{}'.format(account, QUEUE_NAME)
    queue = sqs.Queue(QUEUE_URL)

    count = 1
    sendgroup = datetime.now().strftime('%Y%m%d%H%M%S')
    
    while True:

        qid = str(uuid.uuid1())

        if QUEUE_URL.endswith('.fifo'):
            response = queue.send_message(MessageBody='queue:{}:sendgroup:{} - {}'.format(QUEUE_NAME, sendgroup, str(count)),
                            MessageGroupId=QUEUE_GROUP_ID,
                            MessageDeduplicationId=qid)
        else:
            response = queue.send_message(MessageBody='queue:{}:sendgroup:{} - {}'.format(QUEUE_NAME, sendgroup, str(count)))
        
        print(response)

        count += 1

        if 300 < count:
            break

    print(sendgroup)

if __name__ == "__main__":
    main(sys.argv)
