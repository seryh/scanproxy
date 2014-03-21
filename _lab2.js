var http = require("http");

var options = {
  host: "80.112.143.42",
  port: 80,
  path: "http://ya.ru",
  headers: {
    Host: "ya.ru"
  }
};

	 var req = http.get(options, function(response) {
	  var str = '';
	  response.on('data', function (chunk) {
	    str += chunk;
	  });
	  response.on('end', function () {
	  	console.log(str);
	    console.log(str.indexOf('<title>Яндекс</title>'));
	  });
	})

	req.on('error', function(e) {
  		console.log('problem with request: ' + e.message);
	});

	req.end();