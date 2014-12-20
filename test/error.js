var pull = require('pull-stream')
var cat = require('pull-cat')
var tomany = require('../')
var interleave = require('interleavings')

function error (err) {
  return function (abort, cb) {
    cb(err)
  }
}

interleave.test(function (async) {

  var n = 2
  var err = new Error('closes both streams')

  var err1, err2
  pull(
    cat([pull.values([1,2,3]), error(err)]),
    async.through(),
    tomany([
      pull.collect(function (err) {
        err1 = err
        done()
      }),
      pull.collect(function (err) {
        err2 = err
        done()
      })
    ])
  )

  function done(err, ary) {
    if(--n) return
    if(!err1 || !err2)
      throw new Error('test failed')

    async.done()
  }

})