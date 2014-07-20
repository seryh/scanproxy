var util = require('util'), 
    config = require('./config.json'),
    hexip = require('hexip'),
    moment = require('moment'),
    _ = require('underscore'),
    fs = require('fs');

_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var ipStartLong = hexip.long( hexip.hex(config.ipStart) ),
    ipFinishLong = hexip.long( hexip.hex(config.ipFinish)),
    iteratorCount = ipFinishLong - ipStartLong;

if (iteratorCount <= 0) {
    console.log('config error:: ip range incorrect\n');
    return false;
}

var childCount = process.argv[2] || 100;

if (iteratorCount <= childCount) childCount = 1;

var nowDateStr = moment().format("YYYY-MM-DD_HH_mm"),
    goodProxyFileName = 'proxy_'+nowDateStr+'.txt',
    iteratorCountForWorker = Math.ceil( iteratorCount / childCount ),
    goodProxyListAll = [];

var CONST_CHILD_COUNT = childCount;
var exitCounter = 0;
var maxTimeMinute = Math.ceil(( iteratorCount * config.ports.length/childCount * 6000)/60000);

console.log('\n\tWorked, please wait %s minutes for scanning %s count ip. From date %s',
                maxTimeMinute,
                iteratorCount,
                moment().format("YYYY.MM.DD HH:mm"));
console.log('\tworker created – %s', CONST_CHILD_COUNT);

while(childCount--) {

    if (ipStartLong >= ipFinishLong) return true;

    (function() {

        var worker = require('child_process').fork('./lib/worker.js', ['runAsChild']);

        worker.on('message', function(goodProxyList) {

            if (goodProxyList.length) {

                goodProxyList.forEach(function(goodIpString) {
                    goodProxyListAll.push(goodIpString);
                    fs.appendFile(goodProxyFileName, util.format('%s\n',goodIpString), function(err) {
                        if(err) console.log(err);
                    });
                });
            }

            worker.kill('SIGHUP');
        });

        worker.on('exit', function() {
            exitCounter++;
            console.log('\texit worker:: %s/%s',exitCounter, CONST_CHILD_COUNT);
        });

        worker.on('disconnect', function() {
            exitCounter++;
            console.log('\tdisconnect worker:: %s/%s',exitCounter, CONST_CHILD_COUNT);
        });

        worker.send({
            ipStartString: hexip(hexip.hex(ipStartLong)),
            iteratorCountForWorker: iteratorCountForWorker
        });

    })();

    ipStartLong = ipStartLong + iteratorCountForWorker;
}

process.on('exit', function() {
    if (goodProxyListAll.length) {
        console.log('\n\tWork finish, result in file: %s\n', goodProxyFileName);
    } else {
        console.log('\n\tWork finish, good proxy not found for range: %s – %s\n', config.ipStart, config.ipFinish);
    }
});

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});


/*russian range
 "ipStart" : "80.112.143.42",
 "ipFinish" : "81.112.200.42",
 */




