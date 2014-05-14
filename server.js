/**
 * Jess - Converts Postman API collections to JavaScript libraries
 * @author      me@iaincollins.com
 */

var express = require('express');
var partials = require('express-partials');
var ejs = require('ejs');
var Q = require('q');
var jess = require(__dirname + '/lib/jess');

// Initialise and configure Express and Express Partials
var app = express();
app.use(express.static(__dirname + '/public'))
app.use(partials());
app.use(express.json())
app.use(express.urlencoded());
app.set('title', 'Jess - Converts Postman API collections to libraries and documentation');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('ejs', ejs.__express);
partials.register('.ejs', ejs);

app.get('/', function(req, res, next) {
    res.render('index');
});

app.get('/collections/', function(req, res, next) {
    res.redirect('/');
});

app.get('/collections/:collection', function(req, res, next) {
    // Ignore file extentions for now...
    var filename = req.params.collection.split('.');
    var format = null;
    if (filename.length > 1)
        format = filename[1];

    var collectionId = filename[0].replace(/_/g, ' ');
    var json = collectionId;

    // @todo Wrap in try/catch to handle errors
    jess.getCollection(collectionId)
    .then(function(collection) {
        switch(format) {
            case "md":
                return jess.convertCollection(collection, "markdown");
                break;
            case "html":
                return jess.convertCollection(collection, "html");
                break;
            case "javascript":
            default:
                return jess.convertCollection(collection, "javascript");
                break;
        }
    })
    .then(function(response) {
        switch(format) {
            case "md":
                break;
            case "html":
                break;
            case "javascript":
            default:
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.send(response);
                break;
        }
    });
});


app.post('/json/', function(req, res, next) {
    var collectionJson = req.body.collectionJson;
    var format = req.body.format;
        
    // @todo Wrap in try/catch to handle errors
    jess.parseCollection(collectionJson)
    .then(function(collection) {
        switch(format) {
            case "md":
                return jess.convertCollection(collection, "markdown");
                break;
            case "html":
                return jess.convertCollection(collection, "html");
                break;
            case "javascript":
            default:
                return jess.convertCollection(collection, "javascript");
                break;
        }
    })
    .then(function(generatedContent) {
        switch(format) {
            case "md":
                break;
            case "html":
                break;
            case "javascript":
            default:
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.send(generatedContent);
                break;
        }
    });
});

/**
 * Handle all other requests as 404 / Page Not Found errors
 */
app.use(function(req, res, next) {
    res.status(404).render('page-not-found', { title: "Page not found" });
});

app.listen(3030);