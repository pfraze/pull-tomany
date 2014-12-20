 'use strict';

//split one stream into many.
//if the stream ends, end both streams.
//if a reader stream aborts,
//continue to write to the other stream.

module.exports = function (sinks) {
  var running = 0, totalreads = 0, open = false, ended, reading
  var readFn
  var cbs     = new Array(sinks.length)
  var queues  = new Array(sinks.length)
  var aborted = new Array(sinks.length)
  var nreads  = new Array(sinks.length)

  function init (key, reader) {
    running ++
    queues[key] = []
    nreads[key] = []
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
        nreads[key]++
        cb(null, queues[key].shift())
      }
      else if(ended && nreads[key] == totalreads) {
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
      if(cbs[k] && nreads[k] == totalreads) {
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
      if (end) {
        ended = end
        return endAll()
      }
      totalreads++

      // queue the data first, to ensure same delivery order to all
      for (var k in cbs)
        queues[k].push(data)

      for (var k in cbs) {
        var cb = cbs[k]
        // is a callback ready?
        if (cb && queues[k].length) {
          // send along
          cbs[k] = null
          nreads[k]++
          cb(null, queues[k].shift())
        }
      }
    })
  }

  return function (read) {
    readFn = read
    pull()
  }
}