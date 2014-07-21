var util = require('util'),
    config = require('../config.json'),
    allowPorts = config.ports,
    hexip = require('hexip'),
    portScanner = require('portscanner');

var checkProxy = function(adress, port, callback) {
    var http = require("http");
    var req = http.get({
        host: adress,
        port: port,
        path: "http://ya.ru",
        headers: {
            Host: "ya.ru"
        }
    }, function(response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            var isCheck = (str.indexOf('<title>Яндекс</title>') == -1) ? false : true;
            callback(isCheck, adress, port);
        });
    });

    req.setTimeout( config.proxyTimeout, function( ) {
        callback(false, adress, port);
    });

    req.on('error', function() {
        callback(false, adress, port);
    });

    req.end();
};

var scanRun = function(ipStartString, iteratorCountForWorker, cb) {
    iteratorCountForWorker++;

    var ipStartLong = hexip.long( hexip.hex(ipStartString)),
        goodList = [],
        ipListFromPort = [];

    while(iteratorCountForWorker--) {
        allowPorts.forEach(function(port) {
            ipListFromPort.push({
                ip: hexip(hexip.hex(ipStartLong)),
                port: port
            });
        });
        ipStartLong++;
    }

    (function loop(iterator) {
        //console.log('iterator %d/%d', iterator, ipListFromPort.length);
        if (iterator <= 0) {
            cb(goodList);
            return true;
        }

        iterator--;

        var obj = ipListFromPort[iterator];

        portScanner.checkPortStatus(obj.port, {host: obj.ip, timeout: config.proxyTimeout}, function(error, status) {

            if (status != 'closed') {
                checkProxy(obj.ip, obj.port, function(isCheck, _ip, _port){

                    if (isCheck) {
                        console.log(util.format('\t\t%s:%s', _ip, _port), status);
                        goodList.push(util.format('%s:%s', _ip, _port));
                    }

                    loop(iterator);

                    return true;
                });
                return true;
            }
            loop(iterator);
            return true;
        });

        ipStartLong++;

    })(ipListFromPort.length);

};

if (process.argv[2] == 'runAsChild') {
    process.on('message', function(obj) {
        scanRun(obj.ipStartString, obj.iteratorCountForWorker, function(result) {
            process.send(result);
        });
    });
}

module.exports = scanRun;