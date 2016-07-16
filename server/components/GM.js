'use strict';
//https://github.com/aheckmann/gm

import fs from 'fs';
import gm from 'gm';
import cb2Promise from 'cb-to-promise';
import os from 'os';
import path from 'path';
import { StringHelper } from '../helpers';
import config from '../config/environment';
const TMP_DIR = config.tmpFolder || os.tmpdir();

/**
 * export exif meta data from file
 * @param  {String}   filePath absolute path
 * @param  {Function} cb       callback function
 */
exports.identify = (filePath, cb) => {
  if (cb) {
    return gm(filePath).identify(cb);
  }
  //create promise
  return cb2Promise(gm(filePath).identify)();
};

/**
 * extract exif data as spec
 * @param  {String}   filePath path to image file
 * @param  {Function} cb
 * @return {void}
 */
exports.getExif = (filePath, cb) => {
  gm(filePath).identify((err, data) => {
    if (err) { return cb(err); }

    let defaultObj = {
      cameraBrand: '',
      cameraModel: '',
      lensBrand: '',
      lensModel: '',
      aperture: '', //Max Aperture Value
      angle: '',
      shutterSpeed: '',
      iso: '',
      takenDate: '',
      takenTime: '',
      flash: ''
    };

    if (!data['Profile-EXIF']) { return cb(null, defaultObj); }
    let exif = data['Profile-EXIF'];
    let dateArr = exif['Date Time'] ? exif['Date Time'].split(' ') : [];
    return cb(null, {
      cameraBrand: exif.Make || '',
      cameraModel: exif.Model ||'',
      lensBrand: '', //dont see option for now
      lensModel: '', //dont see option for now
      aperture: exif['Max Aperture Value'], //Max Aperture Value
      angle: '',
      shutterSpeed: '',
      iso: exif['ISO Speed Ratings'],
      takenDate: dateArr.length ? dateArr[0] : '',
      takenTime: dateArr.length === 2 ? dateArr[1] : '',
      flash: exif.Flash
    })
  });
};

/**
 * resize image
 * @param  {String}   filePath absolute file
 * @param  {Object}   options
 * {
 *   width: null or number
 *   height: null or number
 *   force: boolean default is fail means keeping expected ratio
 *   dest: destination of new file, default will write to tmp folder
 * }
 * @param  {Function} cb callback function
 * @return {void}
 */
exports.resize = (filePath, options, cb) => {
  options = options || {};
  let name = StringHelper.getFileName(filePath, true) + '-' +
            StringHelper.randomString(5) +
            StringHelper.getExt(filePath);

  let outName = options.dest || path.resolve(TMP_DIR + '/' + name);
  gm(filePath)
    .resize(options.width, options.height)
    .write(outName, (err) => {
      if (err) { return cb(err); }

      cb(null, {
        path: outName
      });
    });
};

/**
 * thumb image
 * @param  {String}   filePath absolute file
 * @param  {Object}   options
 * {
 *   width: the minimum width of the thumbnail
 *   height: the minimum height of the thumbnail
 *   quality: Adjusts the image compression level. Ranges from 0 to 100 (best).
 *   dest: the path where the image will be saved, otherwise it will be stored in the temp folder
 * }
 * @param  {Function} cb callback function
 * @return {void}
 */
exports.thumb = (filePath, options, cb) => {
  let quality = options.quality || 70;
  let name = StringHelper.getFileName(filePath, true) + '-' +
            StringHelper.randomString(5) + '-' +
            options.width + '-' + options.height +
            StringHelper.getExt(filePath);

  let outName = options.dest || path.resolve(TMP_DIR + '/' + name);

  gm(filePath).thumb(options.width, options.height, outName, quality, (err) => {
    if (err) { return cb(err); }

    cb(null, {
      path: outName,
      quality: quality,
      name: name
    });
  });
};

/**
 * add watermark to image & output to file
 *
 * @param  {String}   filePath path to the file
 * @param  {Object}   options
 * @param  {Function} cb
 * @return {void}
 */
exports.addWatermark = (filePath, options, cb) => {
  options = options || {};
  let name = StringHelper.getFileName(filePath, true) + '-' +
            StringHelper.randomString(5) +
            StringHelper.getExt(filePath);

  let outName = options.dest || path.resolve(TMP_DIR + '/' + name);
  gm(filePath).size(function(err, value){
    var command = 'image Over 10,10 0,0 ' + config.watermarkFile;
    if (!err && value) {
      //TODO - get correct watermark width / height
      let x0 = value.width - 150;
      let y0 = value.height - 150;
      command = `image Over ${x0},${y0} 0,0 ` + config.watermarkFile;
    }

    //TODO - get watermark option (ex position)
    gm(filePath)
    .draw([command])
    .write(outName, (err) => {
      if (err) { return cb(err); }

      cb(null, {
        path: outName
      });
    });
  });
};

/**
 * add watermark to image & output to file
 *
 * @param  {String}   filePath path to the file
 * @param  {Object}   options
 * {
 *   width: number
 *   height: number
 *   dest: path
 * }
 * @param  {Function} cb
 * @return {void}
 */
exports.resizeAndAddWatermark = (filePath, options, cb) => {
  options = options || {};
  let name = StringHelper.getFileName(filePath, true) + '-' +
            StringHelper.randomString(5) +
            StringHelper.getExt(filePath);

  let outName = options.dest || path.resolve(TMP_DIR + '/' + name);
  gm(filePath).size(function(err, value){
    var command = 'image Over 10,10 0,0 ' + config.watermarkFile;
    if (!err && value) {
      //TODO - get correct watermark width / height
      //get ratio
      var width;
      var height;
      if (value.width > value.height) {
        height = Math.floor((value.height/value.width) * options.width);
        width  = options.width;
      } else {
        width  = Math.floor((value.width/value.height) * options.height);
        height = options.height;
      }

      let x0 = width - 50;
      let y0 = height - 50;
      command = `image Over ${x0},${y0} 0,0 ` + config.watermarkFile;
    }

    //TODO - get watermark option (ex position)
    gm(filePath)
    .resize(options.width, options.height)
    .draw([command])
    .write(outName, (err) => {
      if (err) { return cb(err); }

      cb(null, {
        path: outName
      });
    });
  });
};

// Check nude photo
exports.checkNude = (src, callback) => {
  fs.readFile(src, function(err, data) {
    if(err)
      throw err;
    var canvas = new Canvas(1, 1),
      ctx = canvas.getContext('2d'),
      img = new Image,
      skinRegions = [],
      skinMap = [],
      detectedRegions = [],
      mergeRegions = [],
      detRegions = [],
      lastFrom = -1,
      lastTo = -1,
      totalSkin = 0,
      addMerge = function(from, to) {
        lastFrom = from;
        lastTo = to;
        var len = mergeRegions.length,
          fromIndex = -1,
          toIndex = -1,
          region,
          rlen;
        while(len--) {
          region = mergeRegions[len];
          rlen = region.length;
          while(rlen--) {
            if(region[rlen] == from)
              fromIndex = len;
            if(region[rlen] == to)
              toIndex = len;
          }
        }
        if(fromIndex != -1 && toIndex != -1 && fromIndex == toIndex)
          return;
        if(fromIndex == -1 && toIndex == -1)
          return mergeRegions.push([from, to]);
        if(fromIndex != -1 && toIndex == -1)
          return mergeRegions[fromIndex].push(to);
        if(fromIndex == -1 && toIndex != -1)
          return mergeRegions[toIndex].push(from);
        if(fromIndex != -1 && toIndex != -1 && fromIndex != toIndex) {
          mergeRegions[fromIndex] = mergeRegions[fromIndex].concat(mergeRegions[toIndex]);
          mergeRegions = [].concat(mergeRegions.slice(0, toIndex), mergeRegions.slice(toIndex + 1));
        }
      },
      totalPixels,
      imageData,
      length;
    img.src = data;
    canvas.width = img.width;
    canvas.height = img.height;
    totalPixels = canvas.width * canvas.height;
    ctx.drawImage(img, 0, 0);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    length = imageData.length;
    for(var i = 0, u = 1; i < length; i += 4, u++) {
      var r = imageData[i],
        g = imageData[i + 1],
        b = imageData[i + 2],
        x = u > canvas.width ? u % canvas.width - 1 : u,
        y = u > canvas.width ? Math.ceil(u / canvas.width) - 1 : 1;
      if(classifySkin(r, g, b)) {
        skinMap.push({id: u, skin: true, region: 0, x: x, y: y, checked: false});
        var region = -1,
          checkIndexes = [u - 2, u - canvas.width - 2, u - canvas.width - 1, u - canvas.width],
          checker = false;
        for(var o = 0, index; o < 4; o++) {
          index = checkIndexes[o];
          if(skinMap[index] && skinMap[index].skin) {
            if(skinMap[index].region != region && region != -1 && lastFrom != region && lastTo != skinMap[index].region)
              addMerge(region, skinMap[index].region);
            region = skinMap[index].region;
            checker = true;
          }
        }
        if(!checker) {
          skinMap[u - 1].region = detectedRegions.length;
          detectedRegions.push([skinMap[u - 1]]);
          continue;
        }
        else
          if(region > -1) {
            if(!detectedRegions[region])
              detectedRegions[region] = [];
            skinMap[u - 1].region = region;
            detectedRegions[region].push(skinMap[u - 1]);
          }
      }
      else
        skinMap.push({ id: u, skin: false, region: 0, x: x, y: y, checked: false });
    }
    length = mergeRegions.length;
    while(length--) {
      region = mergeRegions[length];
      var rlen = region.length;
      if(!detRegions[length])
        detRegions[length] = [];
      while(rlen--) {
        index = region[rlen];
        detRegions[length] = detRegions[length].concat(detectedRegions[index]);
        detectedRegions[index] = [];
      }
    }
    length = detectedRegions.length;
    while(length--)
      if(detectedRegions[length].length > 0)
        detRegions.push(detectedRegions[length]);
    length = detRegions.length;
    for(var i = 0; i < length; i++)
      if(detRegions[i].length > 30)
        skinRegions.push(detRegions[i]);
    length = skinRegions.length;
    if(length < 3)
      return callback && callback(false);
    (function() {
      var sorted = false, temp;
      while(!sorted) {
        sorted = true;
        for(var i = 0; i < length-1; i++)
          if(skinRegions[i].length < skinRegions[i + 1].length) {
            sorted = false;
            temp = skinRegions[i];
            skinRegions[i] = skinRegions[i + 1];
            skinRegions[i + 1] = temp;
          }
      }
    })();
    while(length--)
      totalSkin += skinRegions[length].length;
    if((totalSkin / totalPixels) * 100 < 15)
      return callback && callback(false);
    if((skinRegions[0].length / totalSkin) * 100 < 35 && (skinRegions[1].length / totalSkin) * 100 < 30 && (skinRegions[2].length / totalSkin) * 100 < 30)
      return callback && callback(false);
    if((skinRegions[0].length / totalSkin) * 100 < 45)
      return callback && callback(false);
    if(skinRegions.length > 60)
      return callback && callback(false);
    return callback && callback(true);
  });
};

exports.gm = gm;