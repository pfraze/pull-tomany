var pull = require('pull-stream')
var tomany = require('../')
var interleave = require('interleavings')
var assert = require('assert')

interleave.test(function (async) {

  var n = 5
  var seen = []
  pull(
    pull.values([1,2,3,4,5]),
    async.through(),
    pull.through(function(v) { seen.push(v) }),
    tomany([
      pull.collect(end),
      pull.collect(end),
      pull.collect(end),
      pull.collect(end),
      pull.collect(end)
    ])
  )

  function end(err, values) {
    assert.deepEqual(values.sort(), seen.sort())
    done()
  }

  function done(err, ary) {
    if(--n) return
    async.done()
  }

})