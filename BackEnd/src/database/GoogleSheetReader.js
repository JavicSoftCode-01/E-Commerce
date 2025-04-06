class GoogleSheetReader {
  constructor(baseUrl, timeout = 30000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async getData(sheetName) {
    return new Promise((resolve, reject) => {
      const callbackName = `googleSheetsCallback_${Date.now()}`;
      const payload = encodeURIComponent(JSON.stringify({ action: 'read', sheetName }));
      const url = `${this.baseUrl}?callback=${callbackName}&payload=${payload}`;

      const script = document.createElement('script');
      script.src = url;

      const timeoutId = setTimeout(() => {
        this._cleanupRequest(script, callbackName);
        reject(new Error('Tiempo de espera agotado'));
      }, this.timeout);

      window[callbackName] = (response) => {
        clearTimeout(timeoutId);
        this._cleanupRequest(script, callbackName);
        if (response.status === 'success') {
          resolve(response.data);
        } else {
          reject(new Error(response.message));
        }
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        this._cleanupRequest(script, callbackName);
        reject(new Error('Error al conectar con Google Sheets'));
      };

      document.body.appendChild(script);
    });
  }

  _cleanupRequest(script, callbackName) {
    if (script.parentNode) {
      document.body.removeChild(script);
    }
    delete window[callbackName];
  }
}

export default GoogleSheetReader;