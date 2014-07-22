var util = require('util'),
    config = require('../config.json'),
    allowPorts = config.ports,
    hexip = require('hexip'),
    async = require('async'),
    http = require("http"),
    portScanner = require('portscanner');

var checkProxy = function(adress, port, callback) {
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

var scanRun = function(ipStartString, iteratorCountForWorker, onFind) {

    var ipStartLong = hexip.long( hexip.hex(ipStartString));

    var _check = function(obj, callback) {
        portScanner.checkPortStatus(obj.port, {host: obj.ip, timeout: config.proxyTimeout}, function(error, status) {

            if (status != 'closed') {
                checkProxy(obj.ip, obj.port, function(isCheck, _ip, _port){

                    if (isCheck) {
                        console.log(util.format('\t\t%s:%s %s, worker–%s', _ip, _port, status, process.pid));
                        onFind(util.format('%s:%s', _ip, _port));
                    }

                    callback(null, {ip: obj.ip, port: obj.port, status: status});

                });

                return true;
            }
            callback(null, {ip: obj.ip, port: obj.port, status: status});

        });
    };

    (function loop() {

        var ipListFromPort = [];

        if (iteratorCountForWorker <= 0) {
            process.exit();
            return true;
        }
        //console.log('\t\t\tchecked:: %s, worker–%s', hexip(hexip.hex(ipStartLong)), process.pid);

        allowPorts.forEach(function(port) {
            ipListFromPort.push({
                ip: hexip(hexip.hex(ipStartLong)),
                port: port
            });
        });

        ipStartLong++;
        iteratorCountForWorker--;

        async.mapSeries(ipListFromPort, _check, function(err, results){
            loop();
            ipListFromPort = null;
        });

    })();

};

if (process.argv[2] == 'runAsChild') {
    process.on('message', function(obj) {

        scanRun(obj.ipStartString, obj.iteratorCountForWorker, function(result) {
            process.send(result);
        });
    });
}

module.exports = scanRun;