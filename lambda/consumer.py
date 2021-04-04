import time

def lambda_handler(event, context):
    for record in event['Records']:
        time.sleep(1)
        print('action:consumed:{}'.format(record['body']))
    # if you don't want to delete message from queue, do something like
    # raise Exception('faild')
    # otherwise message will be removed from queue

