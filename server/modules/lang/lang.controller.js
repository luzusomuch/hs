'use strict';
import * as language from './lang';

class LangController {
  constructor(kernel) {
    this.kernel = kernel;
    this.getLanguage = this.getLanguage.bind(this);
  }

  getLanguage(req, res) {
    let lang = req.query.lang || 'en';
    return res.status(200).json(language[lang]);
  }

}

module.exports = LangController;