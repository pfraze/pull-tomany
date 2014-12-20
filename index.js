 'use strict';

//split one stream into many.
//if the stream ends, end both streams.
//if a reader stream aborts,
//continue to write to the other stream.

module.exports = function (sinks) {
  var running = 0, open = false, ended, reading
  var readFn
  var cbs     = new Array(sinks.length)
  var queues  = new Array(sinks.length)
  var aborted = new Array(sinks.length)

  function init (key, reader) {
    running ++
    queues[key] = []
    reader(function (abort, cb) {
      if(abort) {
        aborted[key] = abort
        queues[key].length = 0
        --running

        // if all sinks have aborted, abort the main sink
        pull(running ? null : abort)
        if(cb) cb(abort)
        return
      }

      if(queues[key].length) {
        if(aborted[key]) return
        cb(null, queues[key].shift())
      }
      else if(ended) {
        return cb(ended)
      }
      else {
        cbs[key] = cb
      }
      pull()
    })
  }

  for(var k in sinks)
    init(k, sinks[k])

  // ends any sinks that have CBs queued
  function endAll () {
    for(var k in cbs) {
      if(cbs[k]) {
        var cb = cbs[k]
        cbs[k] = null
        cb (ended)
      }
    }
  }

  function pull (abort) {
    if(ended || (reading && !abort) || !readFn) return
    reading = true
    readFn(abort, function (end, data) {
      reading = false
      if(end) {
        ended = end
        return endAll()
      }

      for (var i=0; i < cbs.length; i++) {
        var cb = cbs[i]
        // is a callback ready?
        if (cb) {
          // send along
          cbs[i] = null
          cb(null, data)
        } else {
          // put on that sink's queue
          queues[i].push(data)
        }
      }
    })
  }

  return function (read) {
    readFn = read
    pull()
  }
}