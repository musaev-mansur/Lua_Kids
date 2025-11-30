// Заглушка для модуля readline-sync в браузере
module.exports = {
  question: function(query, options) {
    // В браузере просто возвращаем пустую строку
    return '';
  },
  keyInYN: function(query, options) {
    return false;
  },
  keyInSelect: function(items, query, options) {
    return 0;
  },
  prompt: function(options) {
    return '';
  },
  promptCL: function(commandAndArgs, options) {
    return [];
  },
  promptLoop: function(inputHandler, options) {
    return {};
  },
  setDefaultOptions: function(options) {},
  getRawInput: function() {
    return '';
  },
  keyIn: function(query, options) {
    return '';
  },
  keyInPause: function(query, options) {},
  questionEMail: function(query, options) {
    return '';
  },
  questionNewPassword: function(query, options) {
    return '';
  },
  questionPath: function(query, options) {
    return '';
  },
  promptCLLoop: function(commandAndArgs, inputHandler, options) {},
};

