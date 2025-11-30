// Заглушка для process.binding в браузере
// Этот файл должен загружаться до импорта fengari
(function() {
  'use strict';
  
  // Определяем global объект (работает как на сервере, так и в браузере)
  var globalObj;
  if (typeof global !== 'undefined') {
    globalObj = global;
  } else if (typeof window !== 'undefined') {
    globalObj = window;
  } else if (typeof self !== 'undefined') {
    globalObj = self;
  } else {
    // На сервере создаем пустой объект
    globalObj = {};
  }
  
  // Функция для создания bindings
  function createBinding(name) {
    const bindings = {
      'tty_wrap': {
        TTY: function() {
          return {
            isTTY: false,
            setRawMode: function() {},
            getWindowSize: function() { return [24, 80]; },
          };
        },
        isTTY: false,
        setRawMode: function() {},
        getWindowSize: function() { return [24, 80]; },
      },
      'fs': {
        open: function() {},
        read: function() {},
        write: function() {},
        close: function() {},
        readFileSync: function() { 
          if (typeof Buffer !== 'undefined') {
            return Buffer.from('');
          }
          return new Uint8Array(0);
        },
        writeFileSync: function() {},
      },
      'util': {
        getSystemErrorName: function() { return 'ENOENT'; },
      },
      'constants': {
        O_RDONLY: 0,
        O_WRONLY: 1,
        O_RDWR: 2,
        O_CREAT: 64,
        O_TRUNC: 512,
        O_APPEND: 1024,
        S_IRUSR: 256,
        S_IWUSR: 128,
        S_IRGRP: 32,
        S_IWGRP: 16,
        S_IROTH: 4,
        S_IWOTH: 2,
      },
    };
    
    return bindings[name] || {};
  }
  
  if (typeof process === 'undefined') {
    globalObj.process = {
      binding: createBinding,
      env: {},
      version: 'v16.0.0',
      versions: {
        node: '16.0.0',
        v8: '9.0.0',
      },
      platform: typeof window !== 'undefined' ? 'browser' : 'server',
      nextTick: function(fn) { 
        if (typeof setTimeout !== 'undefined') {
          setTimeout(fn, 0);
        } else {
          // На сервере выполняем синхронно
          fn();
        }
      },
      stdin: {
        isTTY: false,
        setRawMode: function() {},
      },
      stdout: {
        isTTY: false,
        write: function() {},
      },
      stderr: {
        isTTY: false,
        write: function() {},
      },
    };
  } else {
    // Если process уже существует, добавляем binding если его нет
    if (!process.binding) {
      process.binding = createBinding;
    }
    
    // Убеждаемся, что stdin/stdout/stderr существуют
    if (!process.stdin) {
      process.stdin = {
        isTTY: false,
        setRawMode: function() {},
      };
    }
    if (!process.stdout) {
      process.stdout = {
        isTTY: false,
        write: function() {},
      };
    }
    if (!process.stderr) {
      process.stderr = {
        isTTY: false,
        write: function() {},
      };
    }
    
    // Убеждаемся, что platform установлен
    if (!process.platform) {
      process.platform = typeof window !== 'undefined' ? 'browser' : 'server';
    }
  }
  
  // Экспортируем process в global, если нужно
  if (typeof globalObj !== 'undefined' && !globalObj.process) {
    globalObj.process = process;
  }
})();
