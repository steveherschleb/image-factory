var imageMagick = require('imagemagick');
var copier = require('dank-copyfile');



var ImageFactory = (function () {
  'use strict';
  
  var DEFAULT_QUALITY = 0.9;
  var DEFAULT_GRAVITY = 'Center';


  function run(image, instruction, callback) {

    var path = image.path.substring(0, image.path.lastIndexOf('/') + 1);
    var filename = image.path.split('/').pop();
    var name = filename.substring(0, filename.lastIndexOf('.'));
    var ext = image.path.split('.').pop();
    
    //Init the options
    var options = {
      srcPath: image.path,
      dstPath: path + name + '-' + instruction.label + '.' + ext,
      gravity: instruction.gravity,
      quality: instruction.quality,
    };
    
    var output = { label: instruction.label, local: options.dstPath, original: options.srcPath, name: filename };

    function resize() {
      imageMagick.resize(options, function(err) {
        callback(err, output );
      });
    }
    
    function crop() {
      //Check if the image has a crop attached and it's the correct format. Example crop format: 100x158+50+70
      if (image.crop && /^\d+x\d+\+\d+\+\d+$/.test(image.crop)) {
        var args = [image.path, '-crop', image.crop, '-resize', options.width + 'x' + options.height, options.dstPath];
        
        imageMagick.convert(args, function(err) {
          callback(err, output );
        });
      } else {
        imageMagick.crop(options, function(err) {
          callback(err, output );
        });
      }
    }

    function copy() {
      copier(options.srcPath, options.dstPath, function(err) {
        callback(err, output );
      });
    }
    

    //Get the image dimension
    imageMagick.identify(image.path, function(err, features) {
      if (err) { return callback(err); }

      //Get aspect ratios
      var desiredAspectRatio = instruction.width / instruction.height;
      var actualAspectRatio = features.width / features.height;
      
      //Make sure the image is large enough to make the desired new size
      if (!instruction.force && (features.width < instruction.width || features.height < instruction.height)) {
        return callback(null, null, 'Image dimensions are too small, so ' + instruction.label + ' image not created for ' + filename);
      }
   
      //Perform the crop if needed
      if (instruction.crop) {
        options.width = instruction.width;
        options.height = instruction.height;
        return crop();
      }

      if (actualAspectRatio > desiredAspectRatio) {
        //The width is the limiting factor
        if (features.width > instruction.width) {
          //The image is too large, shrink it  
          options.width = instruction.width;
          resize();
        } else {
          //The image is smaller than the desired size, so just copy it to the new location
          copy();
        }
      } else {
        //The height is the limiting factor
        if (features.height > instruction.height) {
          //The image is too large, shrink it  
          options.height = instruction.height;
          resize();
        } else {
          //The image is smaller than the desired size, so just copy it to the new location
          copy();
        }
      }
    });
  }
  

  var Constr = function (instructions) {
    //Force object creation
    if (!(this instanceof ImageFactory)) {
      return new ImageFactory(instructions);
    }
    
    //Init
    this.instructions = {};
    this.count = 0;
    
    //Add the instructions if supplied
    if (instructions) {
      this.add(instructions);
    }
  };
      

  Constr.prototype = {
    
    version: require('./package.json').version,
    
    add: function (newInstructions) {
      var i;
      var len;
      
      //Convert to array if needed
      if (!Array.isArray(newInstructions)) {
        newInstructions = [newInstructions];
      }
               
      //Add all the new instructions
      for (i = 0, len = newInstructions.length;i < len; i++) {
        //Validate the instructions, skip over any that don't pass validation
        if (!newInstructions[i]) {
          continue; 
        }
        
        if (!('type' in newInstructions[i]) || typeof newInstructions[i].type !== 'string') {
          continue; 
        }
        
        if (!('label' in newInstructions[i]) || typeof newInstructions[i].label !== 'string') {
          continue; 
        }
        
        if (!('height' in newInstructions[i]) || typeof newInstructions[i].height !== 'number') {
          continue; 
        }
        
        if (!('width' in newInstructions[i]) || typeof newInstructions[i].width !== 'number') {
          continue; 
        }
        
        
        if (!(newInstructions[i].type in this.instructions)) {
          //init this instruction
          this.instructions[newInstructions[i].type] = [];
        }
        

        this.instructions[newInstructions[i].type].push({
          label: newInstructions[i].label,
          height: newInstructions[i].height,
          width: newInstructions[i].width,
          gravity: 'gravity' in newInstructions[i] ? newInstructions[i].gravity : DEFAULT_GRAVITY,
          quality: 'quality' in newInstructions[i] ? newInstructions[i].quality : DEFAULT_QUALITY,
          crop: 'crop' in newInstructions[i] ? newInstructions[i].crop : false,
          force: 'force' in newInstructions[i] ? newInstructions[i].force : true,
        });
        
        this.count++;
      }
    },
    
    
    process: function (type, images, callback) {
      var output = [];
      var messages = [];
      var self = this;

      if (!callback || typeof callback !== 'function') {
        //callback not provided, so just do nothing.
        return;
      }

      if (!(type in this.instructions)) {
        return callback(new Error('invalid image type: ' + type));
      }

      //Convert to Array if needed
      if (!Array.isArray(images)) {
        images = [images];
      }
      
      
      (function outer (x) {
        
        if (x >= images.length) {
          //No more images, we're done!
          return callback(null, output, messages);
        }
        
        if (!images[x].path) {
          //There's no path for this image, so just move on to the next one
          messages.push('Image at index ' + x + ' has no path specified, so it was not processed.');
          return outer(++x);
        }
        
        (function inner (i) {
          if (i >= self.instructions[type].length) {
            //No more instructions, so move to the next image
            return outer(++x);
          }
          
          if ('labels' in images[x] && images[x].labels.indexOf(self.instructions[type][i].label) === -1) {
            //This label is not needed, so go to the next instruction
            return inner(++i);
          }

          run(images[x], self.instructions[type][i], function (err, file, message) {
            if (err) {
              return callback(err);
            }
            
            if (file) {
              output.push(file);
            }

            if (message) {

              messages.push(message);
            }

            //Go to the next instruction
            inner(++i);
          });
        })(0);
      })(0);
    },
  };

  return Constr;

})();


module.exports = ImageFactory;
