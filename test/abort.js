var pull = require('pull-stream')
var cat = require('pull-cat')
var tomany = require('../')
var interleave = require('interleavings')
var assert = require('assert')

function error (err) {
  return function (abort, cb) {
    cb(err)
  }
}

;interleave.test
(function (async) {

  var n = 2
  var err = new Error('closes both streams')

  var ary1, ary2, aborted2, ended
  pull(
    // the first stream should get all values
    // the second value should get the first only
    pull.values([1,2,3,4,5,6,7,8]),
    async.through(),
    //drop in this stream to check that ended happens.
    function (read) {
      return function (abort, cb) {
        read(abort, function (end, data) {
          if(end) ended = end
          cb(end, data)
        })
      }
    },
    tomany([
      pull(
        async.through(),
        pull.collect(function (err, ary) {
          ary1 = ary
          done()
        })),
      pull(
        async.through(),
        function (read) {
          read(null, function (err, data) {
            ary2 = [data]
            read(true, function (end) {
              //abort should wait until all the streams have ended
              //before calling back.
              aborted2 = end
              assert.ok(end)
              done()
            })
          })
        }
      )
    ])
  )

  function done(err, ary) {
    if(--n) return
    assert.deepEqual(ary1, [1,2,3,4,5,6,7,8])
    assert.equal(ary2.length, 1)
    assert.ok(aborted2)
    if(!aborted2 || !ary1)
      throw new Error('test failed')

    async.done()
  }

})//(interleave(1))