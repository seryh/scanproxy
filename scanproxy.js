var util = require('util'), 
    config = require('./config.json'), 
    portscanner = require('portscanner');

config.ipStart = config.ipStart.split('.');
config.ipFinish = config.ipFinish.split('.');

var scanIP = [];

config.ipStart.forEach(function(item, index) {
    config.ipStart[index] = parseInt(item, 10);
    scanIP[index] = config.ipStart[index];
});

config.ipFinish.forEach(function(item, index) {
    config.ipFinish[index] = parseInt(item, 10);
});

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
    req.on('error', function(e) {
        console.log('%s:%s -> problem with request: %s ',adress, port, e.message);
    });

    req.end();
}

var scanRun = function(scanIP, portIndex) {
    var port = config.ports[portIndex];
    portscanner.checkPortStatus(port, scanIP.join('.'), function(error, status) {
            if (status != 'closed') {
                checkProxy(scanIP.join('.'), port, function(isCheck, _adress, _port){
                    if (isCheck) {
                        console.log('Good proxy: %s:%s %s', _adress, _port, status);      
                    } else {
                        console.log('Bad proxy: %s:%s %s', _adress, _port, status);  
                    }
                });
            }

            if (portIndex < config.ports.length-1) {
                portIndex++;
                scanRun(scanIP, portIndex);
                return;
            } else {
                portIndex = 0;
            }
            if (scanIP[3] < config.ipFinish[3]) {
                    scanIP[3]++;
                    scanRun(scanIP, portIndex);
                    return;
            } else if (scanIP[2] < config.ipFinish[2]) {
                    scanIP[2]++;
                    scanIP[3] = 0;
                    scanRun(scanIP, portIndex);
                    return;
            } else if (scanIP[1] < config.ipFinish[1]) {
                    scanIP[1]++;
                    scanIP[3] = 0;
                    scanIP[2] = 0;
                    scanRun(scanIP, portIndex);
                    return;    
            } else if (scanIP[0] < config.ipFinish[0]) {
                    scanIP[0]++;
                    scanIP[3] = 0;
                    scanIP[2] = 0;
                    scanIP[1] = 0;
                    scanRun(scanIP, portIndex);
                    return;
            }
    });
}

scanRun(scanIP, 0);


