
window.APP_CONFIG = {
    API_URL: 'http://10.111.9.80:3009'
  };
  
  window.configPromise = Promise.resolve(window.APP_CONFIG);
  
  fetch('/api-config')
    .then(res => res.json())
    .then(config => {
      window.APP_CONFIG = config;
      console.log('✅ Config carregada:', config.API_URL);
    })
    .catch(() => {
      console.log('ℹ️ Usando config padrão:', window.APP_CONFIG.API_URL);
    });