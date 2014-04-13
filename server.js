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
app.set('title', 'Jess - Converts Postman API collections to JavaScript libraries');
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
    // Ignore optional file extentions (e.g. ".js")
    var path = req.params.collection.split('.');
    var collectionId = path[0].replace(/_/g, ' ');
    var json = collectionId;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader("Access-Control-Allow-Origin", "*");

    // @todo Wrap in try/catch to handle errors
    jess.getCollection(collectionId)
    .then(function(collection) {
        if (collection == null)
            return;
        // @todo create converters for languages other than javascript
        return jess.convertCollection(collection, "javascript");
    })
    .then(function(javascript) {
        res.send(javascript);
    });
});

/**
 * Handle all other requests as 404 / Page Not Found errors
 */
app.use(function(req, res, next) {
    res.status(404).render('page-not-found', { title: "Page not found" });
});

app.listen(3030);