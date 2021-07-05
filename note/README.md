+++
title = "Standard SQS + Lambdaの設定"
date = "2021-04-08"
tags = ["SQS", "Lambda"]
+++

SQSとそのメッセージを処理するLambdaとの間で何が起きているのか知りたい。
それが分かれば、設定するべきパラメータや適切な動作を考えることができる。
と思って幾つかの設定を試したことのまとめを書いておく。

[CDKのコード](https://github.com/suzukiken/cdksqs-lambda-standard)

なお、ここではFIFOではなくスタンダードのSQSのことに限定された話を書く。

### パラメータ

CDKでSQSとLambdaの設定をする際に、色々なパラメータがある。
今回フォーカスするのは以下に抜粋したコードの数字の部分だ。

```
const queue = new sqs.Queue(this, "queue", {
  visibilityTimeout: cdk.Duration.seconds(110),
  deadLetterQueue: {
    maxReceiveCount: 1,
    ....
  },
  ....
})

const lambda_function = new PythonFunction(this, "lambda_function", {
  timeout: cdk.Duration.seconds(2),
  reservedConcurrentExecutions: 1
  ...
})

lambda_function.addEventSource(
  new SqsEventSource(queue, { batchSize: 1 })
)
```

具体的にはこの5箇所となる

* visibilityTimeout: SQSでメッセージが不可視状態にとどまる時間
* maxReceiveCount: メッセージが何度不可視になるか
* timeout: Lambda関数のタイムアウト
* reservedConcurrentExecutions: Lambda関数の同時実行数
* batchSize: Lambda関数に一度に与えられるメッセージの数（バッチサイズ）

このうちmaxReceiveCountについては1に固定した。

このmaxReceiveCountが意味するのは、キューに入ったメッセージが一旦不可視（inflight）になり、また可視となって、
その後もう一度不可視になる、というのを何度まで繰り返したら、デッドレターにするかというリミットの設定だ。

Lambda関数は、inflightなメッセージを処理して、それに成功すればメッセージはSQSから削除され、処理に失敗すれば削除されない。

今回のLambda関数のコードには失敗する要素がないが、Lambda関数が処理を終える前に、
SQSの不可視期間（visibilityTimeout）を過ぎてしまった場合は、可視に戻ってくる。

それを何度か繰り返すと、メッセージがデッドレターキューに移動される。

ちなみに、運用時はこのmaxReceiveCountを5以上で運用すると[AWSのドキュメント](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
処理がされる可能性が高いということが書かれている。

なお、この数字は0ではなく1が最小なことと、
[別のAWSのドキュメント](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)の

> For example, if the source queue has a redrive policy with maxReceiveCount set to 5, and the consumer of the source queue receives a message 6 times without ever deleting it, Amazon SQS moves the message to the dead-letter queue.

を元に考えれば、再試行しないという設定は**できない**事になる。
今回の実験ではここを1にしたので、デッドレターになったメッセージは2回inflightになりながら、
それでも処理されなかったということになる。

### 試した4種類のパターン

まず先に、SQSのメッセージを処理するLambda関数についてだが、
これは、SQSのメッセージ1件に対して、1秒休んでログを残して処理を終わる
という単純なものにしている。

その上でこの４パターンを試した。

|   | バッチサイズの指定 | Lambda関数の同時実行数の指定 |
|---|--------------------|------------------------------|
| 1 | しない             | しない                       |
| 2 | 1               | しない                       |
| 3 | しない             | 1                        |
| 4 | 1               | 1                         |

最初に書いた5つのパラメータのうち、2つのパラメータだけで、このように

* batchSize: 1 or 指定なし
* reservedConcurrentExecutions: 1 or 指定なし

2x2の4パターンにした。

では他のパラメータはというと、

* maxReceiveCount: 前述の通り1に固定
* timeout: 最初に何度か試して分かったが、Lambda関数の処理時間はバッチサイズに依存する。これはすぐに値が決まる。
* visibilityTimeout: なるべくデッドレターキューにメッセージが飛ばないように、少しづずつ時間を長くしていく。場合によっては決定にかなり時間がかかる。

ここからは4パターンそれぞれについて説明する

### 免責

言うまでもないが、この記事は自分の解釈に基づいている。
もちろんできるだけAWSのドキュメントを根拠にしようとしているが、見落としや、解釈の間違いもありうるし、
そもそも書いてある通りに動作していないように見えた部分もあった。
実際に試した結果と付き合わせて、ドキュメントの内容と異なるように見えたところは、
ドキュメントの方を無視することにした。
こんな風だから、間違ったことを書いている可能性も十分ある。