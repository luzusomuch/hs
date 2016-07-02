import async from 'async';
import kernel from '../app';

//TODO - custom args
//let args = process.argv.slice(2);
async.waterfall([
  (cb) => {
    require('./user')(kernel.ES, kernel.model.User, cb);
  },
  (cb) => {
  	require('./category')(kernel.model.Category, cb);
  },
  (cb) => {
  	require('./photo')(kernel.model.Photo, kernel.model.User, cb);
  },
  (cb) => {
  	require('./award')(kernel.model.Photo, kernel.model.User, kernel.model.Award, cb);
  },
  (cb) => {
  	require('./thread')(kernel.model.Thread, kernel.model.User, cb);
  },
  (cb) => {
  	require('./event')(kernel.ES, kernel.model.Event, kernel.model.User, kernel.model.Category, kernel.model.Award, kernel.model.Photo, cb);
  },
  (cb) => {
  	require('./relation')(kernel.model.Relation, kernel.model.User, cb);
  }
], (err) => {
  if (err) {
    console.log('Migrate error', err);
  }

  console.log('migrate data done...');
  process.exit();
});
