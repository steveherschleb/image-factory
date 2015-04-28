var ImageFactory = require('../index');
var fs = require('fs');



describe('The ImageFactory should create an object', function () {
  'use strict';
  
  it('with new', function () {
    var factory = new ImageFactory();
    expect(factory.version).toBeDefined();
    expect(factory.instructions).toEqual({});
    expect(factory.count).toBe(0);
  });
  
  it('without new', function () {
    var factory = ImageFactory();
    expect(factory.version).toBeDefined();
    expect(factory.instructions).toEqual({});
    expect(factory.count).toBe(0);
  });
});


describe('The ImageFactory should accept instructions', function () {
  'use strict';
  
  var thumbnail = { type: 'product', label: 'thumbnail', crop: true, height: 40, width: 60, force: true };
  var main = { type: 'product', label: 'main', height: 400, width: 600, gravity: 'Center', quality: 0.75 };
  var output1 = { product: [{ label: 'thumbnail', crop: true, height: 40, width: 60, force: true, gravity: 'Center', quality: 0.9 }]};
  var output2 = { product: [{ label: 'thumbnail', crop: true, height: 40, width: 60, force: true, gravity: 'Center', quality: 0.9 },
                            { label: 'main', crop: false, height: 400, width: 600, force: true, gravity: 'Center', quality: 0.75 }]};

  it('one at a time at init', function () {
    var factory = new ImageFactory(thumbnail);
    expect(factory.instructions).toEqual(output1);
  });
  
  it('as a single value collection at init', function () {
    var factory = new ImageFactory([thumbnail]);
    expect(factory.instructions).toEqual(output1);
  });
  
  it('as a multiple value collection at init', function () {
    var factory = new ImageFactory([thumbnail, main]);
    expect(factory.instructions).toEqual(output2);
  });
  
  it('one at a time after init', function () {
    var factory = new ImageFactory();
    factory.add(thumbnail);
    expect(factory.instructions).toEqual(output1);
  });
  
  it('as a single value collection after init', function () {
    var factory = new ImageFactory();
    factory.add([thumbnail]);
    expect(factory.instructions).toEqual(output1);
  });
  
  it('as a multiple value collection after init', function () {
    var factory = new ImageFactory();
    factory.add([thumbnail, main]);
    expect(factory.instructions).toEqual(output2);
  });
  
  it('at init and then after init', function () {
    var factory = new ImageFactory(thumbnail);
    factory.add(main);
    expect(factory.instructions).toEqual(output2);
  });
});


describe('The ImageFactory should validate the instructions', function () {
  'use strict';
  
  it('with a blank input', function () {
    var factory = ImageFactory({});
    expect(factory.count).toBe(0);
  });
  
  it('with an empty input', function () {
    var factory = ImageFactory();
    factory.add();
    expect(factory.count).toBe(0);
  });
  
  it('with an input missing the type', function () {
    var factory = ImageFactory({ random: 'product' });
    expect(factory.count).toBe(0);
  });
  
  it('with an input with the wrong kind of type', function () {
    var factory = ImageFactory({ type: [] });
    expect(factory.count).toBe(0);
  });
  
  it('with an input missing the label', function () {
    var factory = ImageFactory({ type: 'product' });
    expect(factory.count).toBe(0);
  });
  
  it('with an input with the wrong kind of label', function () {
    var factory = ImageFactory({ type: 'product', label: [] });
    expect(factory.count).toBe(0);
  });
  
  it('with an input missing the height', function () {
    var factory = ImageFactory({ type: 'product', label: 'main' });
    expect(factory.count).toBe(0);
  });
  
  it('with an input with the wrong kind of height', function () {
    var factory = ImageFactory({ type: 'product', label: 'main', height: '300' });
    expect(factory.count).toBe(0);
  });
  
  it('with an input missing the width', function () {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 300 });
    expect(factory.count).toBe(0);
  });
  
  it('with an input with the wrong kind of width', function () {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 300, width: '600' });
    expect(factory.count).toBe(0);
  });
});


describe('The ImageFactory should validate the process() inputs', function () {
  'use strict';
  
  it('with a missing callback arg', function () {
    var factory = ImageFactory();
    expect(factory.process()).toBeUndefined();
  });
  
  it('with a non-function callback arg', function () {
    var factory = ImageFactory();
    expect(factory.process('product', [], 'callback')).toBeUndefined();
  });
  
  it('with an invalid type', function () {
    var factory = ImageFactory();
    expect(factory.process('product', [], function () {})).toBeUndefined();
  });
});


describe('The ImageFactory should generate images', function () {
  'use strict';
  var testImages = ['kitty.jpg', 'quokka.jpg'];
  
  afterEach(function (done) {

    fs.readdir('./spec', function (err, files) {
      
      for (var i=0, len=files.length;i < len; i++) {
        if (files[i].slice(-3) === 'jpg' && testImages.indexOf(files[i]) === -1) {
          //Remove the image generated image
          fs.unlinkSync('./spec/' + files[i]);
        }
      }

      done();
    });
  });


  it('with a single instruction and single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 400, width: 600 });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
  
  it('with a single instruction and single image that has no path', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 400, width: 600 });
    expect(factory.count).toBe(1);
    
    factory.process('product', [{ random: './spec/kitty.jpg' }], function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(0);
      expect(messages.length).toBe(1);
      done();
    });
  });
  
  it('with a single instruction and single image that requests a label that is not available', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 400, width: 600 });
    expect(factory.count).toBe(1);
    
    factory.process('product', [{ path: './spec/kitty.jpg', labels: 'user' }], function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(0);
      expect(messages.length).toBe(0);
      done();
    });
  });
  
  
  it('with a single instruction and single image that does not exist', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 400, width: 600 });
    expect(factory.count).toBe(1);
    
    factory.process('product', [{ path: './spec/invalid-image.jpg' }], function (err) {
      expect(err).not.toBeNull();
      done();
    });
  });
  
  it('with a single instruction and two images', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 400, width: 600 });
    expect(factory.count).toBe(1);
    
    factory.process('product', [{ path: './spec/kitty.jpg' }, { path: './spec/quokka.jpg' }], function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(2);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        
        fs.stat('./spec/quokka-main.jpg', function (err, stats) {
          expect(err).toBeNull();
          expect(stats.isFile()).toBe(true);
          done();
        });
      });
    });
  });
  

  it('with a single instruction that requests a size smaller than a single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 600, width: 1000 });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
  

  it('with a single instruction that requests a size smaller than a single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 1000, width: 600 });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
  
  
  it('with a single instruction that requests a width larger than a single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 2000, width: 2000 });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
  
  it('with a single instruction that requests a height larger than a single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 1500, width: 3000 });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
  
  it('with a single instruction with force disabled that requests a width larger than a single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 1000, width: 2000, force: false });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(0);
      expect(messages.length).toBe(1);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).not.toBeNull();
        done();
      });
    });
  });
  
  it('with a single instruction with force disabled that requests a height larger than a single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 1500, width: 1800, force: false });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(0);
      expect(messages.length).toBe(1);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).not.toBeNull();
        done();
      });
    });
  });
  
  it('with a single instruction with crop enabled for a single image', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 600, width: 400, crop: true });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
  
  it('with a single instruction with crop enabled for a single image with an invalid crop attached', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 600, width: 400, crop: true });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg', crop: '400x600' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
  
  it('with a single instruction with crop enabled for a single image with a valid crop attached', function (done) {
    var factory = ImageFactory({ type: 'product', label: 'main', height: 600, width: 400, crop: true });
    expect(factory.count).toBe(1);
    
    factory.process('product', { path: './spec/kitty.jpg', crop: '400x600+800+300' }, function (err, images, messages) {
      expect(err).toBeNull();
      expect(images.length).toBe(1);
      expect(messages.length).toBe(0);
      
      fs.stat('./spec/kitty-main.jpg', function (err, stats) {
        expect(err).toBeNull();
        expect(stats.isFile()).toBe(true);
        done();
      });
    });
  });
});


