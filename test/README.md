
To send messages, do this at the root directory of this repository.

```
python -m venv test/env
source test/env/bin/activate
pip3 install -r test/requirements.txt
python test/send_message.py cdksqslambdastandardmrc1
python test/send_message.py cdksqslambdastandardmrc1batch
python test/send_message.py cdksqslambdastandardmrc1conc
python test/send_message.py cdksqslambdastandardmrc1mixed
```

Do this query with CloudWatch Logs Insight.

```
filter @message like /action:[a-z]+:queue:[a-z0-9]+:sendgroup:[-0-9T:]+ - /
| parse @message "action:*:queue:*:sendgroup:* - " as action, queue, sendgroup
| stats count(*) as cnt by queue, action, sendgroup
| display cnt, queue, action, sendgroup
| sort sendgroup desc
```