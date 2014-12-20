# pull-tomany

Duplicate chunks in a pull stream to multiple sinks with back pressure and handling all errors and abort.

## Basic example

use an array of streams to write into.

``` js
var pull = require('pull-stream')
var tomany = require('pull-tomany')
pull(
  pull.values([1,2,3,4,5]),
  //tomany is a sink, so it's the last thing in the pipeline.
  tomany([
    pull.collect(console.log), // => [1,2,3,4,5]
    pull.collect(console.log), // => [1,2,3,4,5]
    pull.collect(console.log)  // => [1,2,3,4,5]
  ])
)
```


## License

MIT
