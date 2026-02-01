document.addEventListener('DOMContentLoaded', () => {
  const solarForm = document.getElementById('solarToLunarForm');
  const lunarForm = document.getElementById('lunarToSolarForm');
  const solarResultEl = document.getElementById('solarResult');
  const lunarResultEl = document.getElementById('lunarResult');

  if (solarForm) {
    solarForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const solarDateInput = document.getElementById('solarDate').value;
      if (!solarDateInput) {
        solarResultEl.textContent = '양력 날짜를 입력해 주세요.';
        return;
      }
      const [year, month, day] = solarDateInput.split('-').map(Number);

      try {
        const response = await fetch('/.netlify/functions/convertLunarSolar', {
          method: 'POST',
          body: JSON.stringify({ type: 'solar2lunar', year, month, day }),
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Conversion failed');
        const lunar = await response.json();

        const lunarMonthLabel = lunar.isLeap ? `윤${lunar.lunarMonth}` : `${lunar.lunarMonth}`;
        solarResultEl.innerHTML = `
            <div><strong>음력:</strong> ${lunar.lunarYear}년 ${lunarMonthLabel}월 ${lunar.lunarDay}일</div>
            <div><strong>윤달 여부:</strong> ${lunar.isLeap ? '윤달' : '평달'}</div>
        `;
      } catch (error) {
        console.error(error);
        solarResultEl.textContent = '계산 중 오류가 발생했습니다.';
      }
    });
  }

  if (lunarForm) {
    lunarForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const lunarDateInput = document.getElementById('lunarDate').value;
      const isLeap = document.getElementById('isLeapMonth').checked;

      if (!lunarDateInput) {
        lunarResultEl.textContent = '음력 날짜를 선택해 주세요.';
        return;
      }

      try {
        const [year, month, day] = lunarDateInput.split('-').map(Number);
        const response = await fetch('/.netlify/functions/convertLunarSolar', {
          method: 'POST',
          body: JSON.stringify({ type: 'lunar2solar', year, month, day, isLeap }),
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Conversion failed');
        const solar = await response.json();

        lunarResultEl.innerHTML = `
          <div><strong>양력:</strong> ${solar.solarYear}년 ${solar.solarMonth}월 ${solar.solarDay}일</div>
        `;
      } catch (error) {
        console.error(error);
        lunarResultEl.textContent = '변환할 수 없는 날짜이거나 오류가 발생했습니다.';
      }
    });
  }
});
