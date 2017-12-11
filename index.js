var scheduler = require('nanoscheduler')()
var assert = require('assert')

module.exports = onPerformance

function onPerformance (cb) {
  assert.equal(typeof cb, 'function', 'on-performance: cb should be type function')

  var PerformanceObserver = typeof window !== 'undefined' && window.PerformanceObserver
  if (!PerformanceObserver) return

  var observer = new PerformanceObserver(handler)
  observer.observe({
    entryTypes: [
      'frame',      // not implemented yet in any browser
      'measure',
      'navigation',
      'resource',
      'longtask'
    ]
  })

  window.performance.getEntries().forEach(function (entry) {
    scheduler.push(function () {
      cb(entry)
      clear(entry)
    })
  })

  function handler (list) {
    list.getEntries().forEach(function (entry) {
      scheduler.push(function () {
        clear(entry)
        cb(entry)
      })
    })
  }

  // Workaround to prevent the observer instance from being garbage collected
  // https://twitter.com/choojs/status/876098840495091713
  window['obs' + window.performance.now()] = observer

  return observer.disconnect.bind(observer)

  // Navigation, longtask and frame don't have a clear method (yet)
  // Resource timings can only be cleared in bulk
  // see: https://developer.mozilla.org/en-US/docs/Web/API/Performance/clearMeasures
  function clear (entry) {
    var type = entry.entryType
    if (type === 'measure') {
      window.performance.clearMeasures(entry.name)
    } else if (type === 'resource') {
      window.performance.clearResourceTimings()
    }
  }
}
