var gm = require('gm').subClass({
    imageMagick: true
});
var AWS = require('aws-sdk');
var async = require('async');

var s3 = new AWS.S3();

exports.handler = function(event, context) {
    console.log('event: ' + JSON.stringify(event));

    var obj = {
        'bucket': event.Records[0].s3.bucket.name,
        'bucketOut': event.Records[0].s3.bucket.name.replace("-backup",""),
        'key': event.Records[0].s3.object.key,
    };

    async.waterfall([
        function download(next) {
            s3.getObject({
                Bucket: obj.bucket,
                Key: obj.key
            },
            next);
        },
        function transform(response, next) {
            gm(response.Body).size(function(err, size) {
                var width = size.width * 0.8;
                var height = size.height * 0.8;
                this.resize(width, height).toBuffer('PNG', function(err, buffer) {
                    next(null, buffer);
                });
            });
        },
        function upload(data, next) {
            var newFileName = obj.key;
            console.log("Uploading data to: " + obj.bucketOut);
            s3.putObject({
                Bucket: obj.bucketOut,
                Key: newFileName,
                Body: data,
                ContentType: "image/png" // set contentType as HTML
            },
            next);
        }
    ], function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log('Success');
        }
        context.done();
    });

};
