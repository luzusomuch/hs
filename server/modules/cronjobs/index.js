import async from 'async';
import kernel from '../../app';

async.parallel([
	(cb) => {
		require('./processEvent')(kernel, cb);
	}
], () => {
	console.log('done!');
  setTimeout(() => {
    process.exit();
  }, 10 * 60 * 1000);
});