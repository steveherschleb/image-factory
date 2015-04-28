# image-factory
Create different images sizes.


## Installation

    npm install image-factory --save


## Dependencies

This project requires ImageMagick, the awesome open source command line image processor. ImageMagick actually does all of the work, this is just a wrapper
to make your life easier. If you don't have ImageMagick, get it. 

You can use `apt-get install imagemagick`, or `brew install imagemagick`, or [download the 
binaries for windows or linux](http://www.imagemagick.org/script/install-source.php).


## Usage

You'd use the image factory to generate various image sizes for your responsive website. For example, you want to take one large product
image and then generate a smaller one, a cropped one, a thumbnail and maybe some retina ready (i.e. @2x) ones. 

You have to first initialize some instructions so it knows what images you want created. Then just pass it one or more images and a bunch of new images will
be created based on your instructions.

Here's an example usage:

```javascript
var factory = require('image-factory')();

//Init the instructions
factory.add({ type: 'product', label: 'main', width: 300, height: 400 });
factory.add({ type: 'product', label: 'thumbnail', width: 60, height: 60, crop: true });
factory.add({ type: 'blog', label: 'main', width: 600, height: 600 });

//Process an image
factory.process('product', { path: '/tmp/kitty.jpg' }, function (err, images, messages) {
  console.log(err) // undefined
  console.log(images) // a arry of image data objects
  console.log(messages) // an array of messages (usually empty)
});
```
    

Once the processing is done, you should have two new images in your /tmp directory: kitty-main.jpg and kitty-thumbnail.jpg.


## A Note on Performance

ImageMagick tends to use lots of the available CPU computing power. This module processes all the images serially but has no queue or similar. If you call process() a bunch
of times in parallel, your CPU will max out and responsiveness and overall performance will suffer. You may run out of memory. Please don't attempt to use this for 
high throughput applications without a queue, multiple servers, load balancing, etc.


## Tests

  npm test


## Contributing

Fork and send a pull request. Make sure to test and jshint your code.


## Release History

* 0.1.0 Initial release


## License

MIT 
