(function() {
  function addComma(n) {
    n = (n == null ? '' : String(n)).replace(/[^\d]/g, '');
    return n ? parseInt(n, 10).toLocaleString('ko-KR') : '';
  }

  function removeComma(n) {
    return (n == null ? '' : String(n)).replace(/,/g, '');
  }

  window.utils = {
    addComma: addComma,
    removeComma: removeComma
  };
})();


