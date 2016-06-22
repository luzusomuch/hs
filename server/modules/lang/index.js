import LangController from './lang.controller';

exports.routes = (kernel) => {
  let controller = new LangController(kernel);

  kernel.app.get('/api/v1/langs', controller.getLanguage);
};