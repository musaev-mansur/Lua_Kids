// Заглушка для модуля tmp в браузере
// Должна соответствовать API модуля tmp
module.exports = {
  dirname: function(callback) {
    if (callback) {
      callback(null, '/tmp');
    }
    return '/tmp';
  },
  file: function(options, callback) {
    if (callback) {
      // Возвращаем фиктивный путь
      callback(null, '/tmp/fake-file', function() {});
    }
  },
  fileSync: function(options) {
    // Возвращаем объект с путем и функцией cleanup
    return {
      name: '/tmp/fake-file',
      removeCallback: function() {}
    };
  },
  tmpdir: function() { 
    return '/tmp'; 
  },
  setGracefulCleanup: function() {},
  // Дополнительные методы, которые могут использоваться
  mkdir: function(callback) {
    if (callback) {
      callback(null, '/tmp');
    }
    return '/tmp';
  },
  mkdirSync: function() {
    return '/tmp';
  },
  // Метод, используемый в loslib.js
  tmpNameSync: function(options) {
    // Генерируем уникальное имя файла
    return '/tmp/tmp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  },
};

