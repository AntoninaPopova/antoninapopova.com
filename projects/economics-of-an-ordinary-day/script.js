
'use strict';

const DATA_PATH = './data/time_use_wages_merged.csv';

const ACTIVITIES = [
  {
    key: 'Paid work or study',
    label: 'Paid work or study',
    color: '#2448d8'
  },
  {
    key: 'Unpaid work',
    label: 'Unpaid work',
    color: '#ee785d'
  },
  {
    key: 'Personal care',
    label: 'Personal care',
    color: '#b5c0d6'
  },
  {
    key: 'Leisure',
    label: 'Leisure',
    color: '#9abca8'
  },
  {
    key: 'Other',
    label: 'Other',
    color: '#777f90'
  }
];

const nf = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1
});

const integerFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
});

function el(tag, className, text) {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

// Handles quoted commas, escaped quotes, BOM and CRLF.
function parseCSV(source) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const c = source[i];

    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') {
        i++;
      }

      row.push(cell);

      if (row.some(x => x !== '')) {
        rows.push(row);
      }

      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }

  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift()?.map((s, i) =>
    i === 0
      ? s.replace(/^\uFEFF/, '').trim()
      : s.trim()
  ) || [];

  return rows.map(values =>
    Object.fromEntries(
      headers.map((h, i) => [h, values[i] ?? ''])
    )
  );
}

// Signed difference: Women minus Men.
// Convert hours to minutes before formatting.
function formatSignedDifference(hours) {
  const totalMinutes = Math.round(Math.abs(hours) * 60);

  if (totalMinutes === 0) {
    return '0 min';
  }

  const sign = hours > 0 ? '+' : '−';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${sign}${m} min`;
  }

  if (m === 0) {
    return `${sign}${h} h`;
  }

  return `${sign}${h} h ${m} min`;
}

function formatHoursMinutes(hours) {
  const totalMinutes = Math.round(hours * 60);

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${m}min`;
  }

  if (m === 0) {
    return `${h}h`;
  }

  return `${h}h${m}min`;
}


function formatDurationText(hours) {
  const totalMinutes = Math.round(Math.abs(hours) * 60);

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  const parts = [];

  if (h > 0) {
    parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  }

  if (m > 0) {
    parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`);
  }

  return parts.length ? parts.join(' and ') : '0 minutes';
}


function drawLegend() {
  const target = document.getElementById('legend');
  target.replaceChildren();

  for (const activity of ACTIVITIES) {
    const item = el('div', 'legend-item');
    const swatch = el('span', 'legend-swatch');

    swatch.style.background = activity.color;

    item.append(
      swatch,
      el('span', '', activity.label)
    );

    target.append(item);
  }
}

// ============================================================
// CHAPTER 1 — THE DAY
// ============================================================

function renderCountry(country, data) {
  const rows = data.filter(d => d.country === country);

  const chart = document.getElementById('time-chart');
  const insight = document.getElementById('insight');

  const tooltip = document.getElementById('activity-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipDifference = document.getElementById('tooltip-difference');
  const container = document.querySelector('.time-chart-container');

  chart.replaceChildren();
  insight.replaceChildren();

  const women = rows.find(r => r.sex === 'Female');
  const men = rows.find(r => r.sex === 'Male');

  if (!women || !men) return;

  // References to the matching segments in both bars.
  const segmentGroups = new Map();

  let activeSegment = null;

  function clearHighlight() {
    activeSegment = null;

    for (const segments of segmentGroups.values()) {
      for (const segment of segments) {
        segment.classList.remove('is-highlighted');
      }
    }

    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
  }

  function highlightActivity(activity, anchor) {
    activeSegment = anchor;

    for (const segments of segmentGroups.values()) {
      for (const segment of segments) {
        segment.classList.remove('is-highlighted');
      }
    }

    anchor.classList.add('is-highlighted');

    // Tooltip content.
    tooltipTitle.textContent = activity.label;

    const womenHours = women[activity.key];
    const menHours = men[activity.key];

    const difference = womenHours - menHours;

    tooltipDifference.textContent =
      formatSignedDifference(difference);

    // Position the tooltip above the hovered segment.
    const containerRect = container.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();

    const centerX =
      anchorRect.left +
      anchorRect.width / 2 -
      containerRect.left;

    const topY =
      anchorRect.top - containerRect.top;

    // Keep the tooltip inside the chart width.
    const tooltipHalfWidth = tooltip.offsetWidth / 2;
    const padding = 6;

    const minX = tooltipHalfWidth + padding;
    const maxX = containerRect.width - tooltipHalfWidth - padding;

    const safeX = maxX >= minX
      ? Math.max(minX, Math.min(maxX, centerX))
      : containerRect.width / 2;

    tooltip.style.left = `${safeX}px`;
    tooltip.style.top = `${topY}px`;

    tooltip.classList.add('is-visible');
    tooltip.setAttribute('aria-hidden', 'false');
  }

  for (const [sex, label] of [
    ['Female', 'Women'],
    ['Male', 'Men']
  ]) {
    const d = rows.find(r => r.sex === sex);

    const wrapper = el('div', 'time-row');
    const bar = el('div', 'time-bar');

    bar.setAttribute('role', 'group');
    bar.setAttribute(
      'aria-label',
      `${label}: average daily time allocation`
    );

    for (const activity of ACTIVITIES) {
      const hours = d[activity.key];

      const segment = el('button', 'time-segment');
      segment.type = 'button';

      segment.style.background = activity.color;
      segment.style.flexGrow = String(hours);
      segment.style.flexBasis = '0';

      segment.setAttribute(
        'aria-label',
        `${label}, ${activity.label}: ${nf.format(hours)} hours per day`
      );

      if (hours === 0) {
        segment.disabled = true;
      }

      // Only display in-bar numbers for larger segments.
      if (hours >= 1.5) {
        const hoursLabel = el(
          'span',
          'segment-hours-hover',
          formatHoursMinutes(hours)
        );

        segment.append(hoursLabel);
      }

      if (!segmentGroups.has(activity.key)) {
        segmentGroups.set(activity.key, []);
      }

      segmentGroups.get(activity.key).push(segment);

      segment.addEventListener('mouseenter', () => {
        highlightActivity(activity, segment);
      });

      segment.addEventListener('mouseleave', () => {
        // Avoid clearing a newer selection.
        if (activeSegment === segment) {
          clearHighlight();
        }
      });

      segment.addEventListener('focus', () => {
        highlightActivity(activity, segment);
      });

      segment.addEventListener('blur', () => {
        if (activeSegment === segment) {
          clearHighlight();
        }
      });

      // Clicking also reveals the comparison on touchscreens.
      segment.addEventListener('click', () => {
        highlightActivity(activity, segment);
      });

      bar.append(segment);
    }

    wrapper.append(
      el('div', 'time-row-label', label),
      bar
    );

    chart.append(wrapper);
  }

// Chapter 1 — Daily unpaid-work difference.

const diff = women['Unpaid work'] - men['Unpaid work'];
const absoluteDifference = Math.abs(diff);
const differenceMinutes = Math.round(absoluteDifference * 60);

const label = el(
  'span',
  'eyebrow result-label',
  'THE UNPAID WORK GAP'
);

const number = el(
  'strong',
  'result-value',
  formatHoursMinutes(absoluteDifference)
);

const unit = el(
  'span',
  'result-unit',
  'PER DAY'
);

const direction = differenceMinutes === 0
  ? `Women and men spend approximately the same amount ` +
    `of time on unpaid work in ${country}.`
  : `${diff > 0 ? 'Women' : 'Men'} spend approximately ` +
    `${formatDurationText(absoluteDifference)} more per day ` +
    `on unpaid work than ${diff > 0 ? 'men' : 'women'} ` +
    `in ${country}.`;

const copy = el(
  'p',
  'result-copy',
  direction
);

  insight.append(label, number, unit, copy);

  clearHighlight();

  // Keep Chapters 2 and 3 synchronized with the country selector.
  renderAccumulation(country, data);
  renderValuation(country, data);
  renderOpportunity(country, data);
}

// ============================================================
// CHAPTER 2 — ACCUMULATION
// ============================================================

function formatYearsMonths(years) {
  const totalMonths = Math.round(years * 12);

  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;

  const parts = [];

  if (y > 0) {
    parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
  }

  if (m > 0) {
    parts.push(`${m} ${m === 1 ? 'month' : 'months'}`);
  }

  return parts.length
    ? parts.join(' and ')
    : 'less than a month';
}

function getTimePerspective(hours) {
  const h = Math.round(hours);

  if (h === 0) {
    return {
      lead: 'No measurable difference in accumulated unpaid work.',
      detail: 'Women and men have approximately the same total in this projection.'
    };
  }

  // Personal project: less than 1,000 hours
  if (h < 1000) {
    const duration = formatYearsMonths(hours / 365);

    return {
      lead: `The equivalent of spending one hour every day for ${duration}`,
      detail: 'developing a personal project of your own.'
    };
  }

  // Reading: 1,000–1,799 hours
  if (h < 1800) {
    const books = Math.round(hours / 8);

    return {
      lead: `The equivalent of reading approximately ${integerFormat.format(books)} books,`,
      detail: "assuming eight hours per book. That's an entire personal library."
    };
  }

  // Early career: 1,800–4,499 hours
  if (h < 4500) {
    const duration = formatYearsMonths(hours / 2000);

    return {
      lead: `The equivalent of spending ${duration} working full-time`,
      detail: 'in a new profession, gaining experience and developing new skills.'
    };
  }

  // Bachelor's degree: 4,500–6,299 hours
  if (h < 6300) {
    return {
      lead: "Time comparable to the study workload of a three-year bachelor's degree,",
      detail: 'potentially opening the door to an entirely new profession.'
    };
  }

  // Bachelor's and master's degrees: 6,300–9,999 hours
  if (h < 10000) {
    return {
      lead: "Time comparable to studying for both a bachelor's and a master's degree,",
      detail: 'moving from the foundations of a subject to specialising in it.'
    };
  }

  // Career experience: 10,000–14,999 hours
  if (h < 15000) {
    const duration = formatYearsMonths(hours / 2000);

    return {
      lead: `The equivalent of ${duration} of full-time work`,
      detail: '— enough time to develop skills, gain experience and establish yourself in a new career.'
    };
  }

  // Long-term career: 15,000+ hours
  const duration = formatYearsMonths(hours / 2000);

  return {
    lead: `The equivalent of ${duration} of full-time work`,
    detail: '— enough time to build substantial experience in a profession, starting from the very beginning.'
  };
}



function renderAccumulation(country, data) {
  const rows = data.filter(d => d.country === country);

  const women = rows.find(r => r.sex === 'Female');
  const men = rows.find(r => r.sex === 'Male');

  if (!women || !men) return;

  const slider = document.getElementById('period-slider');
  const years = Number(slider.value);
  const days = years * 365;

  const womenDaily = women['Unpaid work'];
  const menDaily = men['Unpaid work'];

  const womenHours = womenDaily * days;
  const menHours = menDaily * days;

  const difference = womenHours - menHours;
  const absoluteDifference = Math.abs(difference);

  document.getElementById('accumulation-country-name')
    .textContent = country;

  document.getElementById('period-value')
    .textContent = years;

  document.getElementById('period-unit')
    .textContent = years === 1 ? 'YEAR' : 'YEARS';

  slider.setAttribute(
    'aria-valuetext',
    `${years} ${years === 1 ? 'year' : 'years'}`
  );

  document.getElementById('women-total')
    .textContent = `${integerFormat.format(womenHours)} h`;

  document.getElementById('men-total')
    .textContent = `${integerFormat.format(menHours)} h`;

  // Fixed 10-year scale so bars grow as the slider moves.
  const maximum = Math.max(
    womenDaily,
    menDaily,
    1
  ) * 365 * 10;

  document.getElementById('women-accumulation-bar')
    .style.width = `${womenHours / maximum * 100}%`;

  document.getElementById('men-accumulation-bar')
    .style.width = `${menHours / maximum * 100}%`;

  document.getElementById('difference-total')
    .textContent = integerFormat.format(absoluteDifference);

  const perspective = getTimePerspective(absoluteDifference);

  document.getElementById('perspective-note').textContent =
    `${perspective.lead} ${perspective.detail}`;
}

// ============================================================
// CHAPTER 3 — VALUATION
// ============================================================

// Expects the following wage columns:
// Elementary, Service, Professional
// Elementary_common, Service_common, Professional_common
//
// The occupational columns contain gender-specific wages.
// The _common columns contain the average of female and male
// wages for the same occupation.

function renderValuation(country, data) {
  const rows = data.filter(row => row.country === country);

  const women = rows.find(row => row.sex === 'Female');
  const men = rows.find(row => row.sex === 'Male');

  if (!women || !men) return;

  const occupation = document.querySelector(
    'input[name="valuation-occupation"]:checked'
  ).value;

  const basis = document.querySelector(
    'input[name="valuation-basis"]:checked'
  ).value;

  const years = Number(
    document.getElementById('period-slider').value
  );

  const status = document.getElementById('valuation-status');

  const commonPanel = document.getElementById(
    'valuation-common-rate'
  );

  const genderPanel = document.getElementById(
    'valuation-gender-rates'
  );

  const common = basis === 'common';

  // Display one rate for common wages,
  // two rates for gender-specific wages.
  commonPanel.hidden = !common;
  genderPanel.hidden = common;

  document.getElementById('valuation-country-name')
    .textContent = country;

  document.getElementById('valuation-years')
  .textContent = `${years} ${years === 1 ? 'year' : 'years'}`;

  // Display the wage reference year from the dataset.
  const year = women.year && women.year === men.year
    ? women.year
    : (women.year || men.year || 'Not specified');

  document.getElementById('valuation-year')
    .textContent = year;

  // Choose the relevant wage columns.
  const femaleRate = common
    ? women[`${occupation}_common`]
    : women[occupation];

  const maleRate = common
    ? men[`${occupation}_common`]
    : men[occupation];

  // A common rate must be identical in both records.
  const valid =
    Number.isFinite(femaleRate) &&
    femaleRate >= 0 &&
    Number.isFinite(maleRate) &&
    maleRate >= 0 &&
    (
      !common ||
      Math.abs(femaleRate - maleRate) < 1e-7
    );

  const ids = [
    'valuation-women-total',
    'valuation-men-total',
    'valuation-difference',
    'valuation-common-amount',
    'valuation-female-rate',
    'valuation-male-rate'
  ];

  if (!valid) {
    ids.forEach(id => {
      document.getElementById(id).textContent = '—';
    });

    document.getElementById('valuation-women-bar')
      .style.width = '0%';

    document.getElementById('valuation-men-bar')
      .style.width = '0%';

    document.getElementById('valuation-insight')
      .textContent = '';

    status.hidden = false;

    status.textContent =
      `Wage data are unavailable or inconsistent for ${country} ` +
      `(${occupation}, ${common ? 'common' : 'gender-specific'}).`;

    return;
  }

  status.hidden = true;

  // Annual unpaid-work hours multiplied by the wage benchmark.
  const womenValue =
    women['Unpaid work'] * 365 * years * femaleRate;

  const menValue =
    men['Unpaid work'] * 365 * years * maleRate;

  const difference = womenValue - menValue;

  const format = value => integerFormat.format(value);

  const wageFormat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});



// Display selected hourly wage rates.

document.getElementById('valuation-common-amount')
  .textContent = `$${wageFormat.format(femaleRate)}`;

document.getElementById('valuation-female-rate')
  .textContent = `$${wageFormat.format(femaleRate)}`;

document.getElementById('valuation-male-rate')
  .textContent = `$${wageFormat.format(maleRate)}`;

// Display accumulated monetary values.

document.getElementById('valuation-women-total')
  .textContent = `$${format(womenValue)}`;

document.getElementById('valuation-men-total')
  .textContent = `$${format(menValue)}`;

document.getElementById('valuation-difference')
  .textContent =
    `${difference < 0 ? '−' : ''}$${format(Math.abs(difference))}`;



  // Both bars use the same scale.
  const max = Math.max(womenValue, menValue, 1);

  document.getElementById('valuation-women-bar')
    .style.width = `${womenValue / max * 100}%`;

  document.getElementById('valuation-men-bar')
    .style.width = `${menValue / max * 100}%`;

  // Explain the result according to the selected wage basis.
  const direction = Math.abs(difference) < 0.5
    ? 'approximately equal estimated values for women and men'
    : `$${format(Math.abs(difference))} (in 2021 PPP) more in estimated value ` +
      `for ${difference > 0 ? 'women' : 'men'}`;

  document.getElementById('valuation-insight')
    .textContent = common
      ? `Using the same ${occupation.toLowerCase()} hourly wage ` +
        `for both groups produces ${direction} over ${years} ` +
        `${years === 1 ? 'year' : 'years'}. ` +
        `This difference reflects unpaid-work hours alone.`
      : `Using separate women's and men's ` +
        `${occupation.toLowerCase()} wages produces ${direction} ` +
        `over ${years} ${years === 1 ? 'year' : 'years'}. ` +
        `This difference reflects both unpaid-work hours ` +
        `and hourly pay.`;
}



// ============================================================
// CHAPTER 4 — OPPORTUNITY
// ============================================================

function renderOpportunity(country, data) {

  const rows = data.filter(
    row => row.country === country
  );

  const women = rows.find(
    row => row.sex === 'Female'
  );

  const men = rows.find(
    row => row.sex === 'Male'
  );

  if (!women || !men) return;


  // ----------------------------------------------------------
  // INHERITED PARAMETERS
  // ----------------------------------------------------------

  const years = Number(
    document.getElementById('period-slider').value
  );

  const occupation = document.querySelector(
    'input[name="valuation-occupation"]:checked'
  ).value;

  const basis = document.querySelector(
    'input[name="valuation-basis"]:checked'
  ).value;

  const common = basis === 'common';

  const days = years * 365;

  const periodText =
    `${years} ${years === 1 ? 'year' : 'years'}`;


  // ----------------------------------------------------------
  // REALLOCATION PARAMETER
  // ----------------------------------------------------------

  const slider = document.getElementById(
    'opportunity-slider'
  );

  const percentage = Number(slider.value);

  const share = percentage / 100;

  const maximumShare = Number(slider.max) / 100;


  // ----------------------------------------------------------
  // FORMATTING HELPERS
  // ----------------------------------------------------------

  const setText = (id, value) => {
    document.getElementById(id).textContent = value;
  };

  const moneyFormat = value =>
    `$${integerFormat.format(value)}`;

  const wageFormat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });


  // ----------------------------------------------------------
  // DISPLAY SELECTED PARAMETERS
  // ----------------------------------------------------------

  setText(
    'opportunity-country-name',
    country
  );

  setText(
    'opportunity-years',
    periodText
  );

  setText(
    'opportunity-occupation',
    `${occupation} occupations`
  );

  setText(
    'opportunity-basis',
    common
      ? 'Common hourly wage'
      : 'Gender-specific wages'
  );

  setText(
    'opportunity-share-value',
    `${percentage}%`
  );

  slider.setAttribute(
    'aria-valuetext',
    `${percentage} percent`
  );


  // ----------------------------------------------------------
  // DISPLAY THE RELEVANT WAGE PANEL
  // ----------------------------------------------------------

  document.getElementById(
    'opportunity-common-rate'
  ).hidden = !common;

  document.getElementById(
    'opportunity-gender-rates'
  ).hidden = common;


  // Wage reference year

  const year =
    women.year && women.year === men.year
      ? women.year
      : women.year && men.year
        ? `${women.year} / ${men.year}`
        : women.year || men.year || 'Not specified';

  setText(
    'opportunity-year',
    year
  );


  // ----------------------------------------------------------
  // SELECT HOURLY WAGES
  // ----------------------------------------------------------

  const femaleRate = common
    ? women[`${occupation}_common`]
    : women[occupation];

  const maleRate = common
    ? men[`${occupation}_common`]
    : men[occupation];


  // ----------------------------------------------------------
  // VALIDATE WAGE DATA
  // ----------------------------------------------------------

  const valid =
    Number.isFinite(femaleRate) &&
    femaleRate >= 0 &&
    Number.isFinite(maleRate) &&
    maleRate >= 0 &&
    (
      !common ||
      Math.abs(femaleRate - maleRate) < 1e-7
    );

  const status = document.getElementById(
    'opportunity-status'
  );

  const womenBar = document.getElementById(
    'opportunity-women-bar'
  );

  const menBar = document.getElementById(
    'opportunity-men-bar'
  );

  if (!valid) {

    [
      'opportunity-common-amount',
      'opportunity-female-rate',
      'opportunity-male-rate',
      'opportunity-women-total',
      'opportunity-men-total',
      'opportunity-difference'
    ].forEach(id => setText(id, '—'));

    womenBar.style.width = '0%';
    menBar.style.width = '0%';

    setText('opportunity-insight', '');

    status.hidden = false;

    status.textContent =
      `Wage data are unavailable or inconsistent ` +
      `for ${country} under the selected assumptions.`;

    return;

  }

  status.hidden = true;


  // ----------------------------------------------------------
  // DISPLAY HOURLY WAGES
  // ----------------------------------------------------------

  setText(
    'opportunity-common-amount',
    `$${wageFormat.format(femaleRate)}`
  );

  setText(
    'opportunity-female-rate',
    `$${wageFormat.format(femaleRate)}`
  );

  setText(
    'opportunity-male-rate',
    `$${wageFormat.format(maleRate)}`
  );


  // ----------------------------------------------------------
  // CALCULATE REALLOCATED TIME
  // ----------------------------------------------------------

  const womenDaily = women['Unpaid work'];
  const menDaily = men['Unpaid work'];

  const womenHours = womenDaily * days * share;

  const menHours = menDaily * days * share;


  // ----------------------------------------------------------
  // CALCULATE POTENTIAL ADDITIONAL EARNINGS
  // ----------------------------------------------------------

  const womenEarnings = womenHours * femaleRate;

  const menEarnings = menHours * maleRate;

  const difference = womenEarnings - menEarnings;

  const absoluteDifference = Math.abs(difference);


  // ----------------------------------------------------------
  // DISPLAY MONETARY TOTALS
  // ----------------------------------------------------------

  setText(
    'opportunity-women-total',
    moneyFormat(womenEarnings)
  );

  setText(
    'opportunity-men-total',
    moneyFormat(menEarnings)
  );

  setText(
    'opportunity-difference',
    moneyFormat(absoluteDifference)
  );


  // ----------------------------------------------------------
  // CHART
  //
  // Fixed scale for the selected country, wage assumptions
  // and projection period. Maximum = 50% reallocation.
  // ----------------------------------------------------------

  const maximum = Math.max(

    womenDaily * days * maximumShare * femaleRate,

    menDaily * days * maximumShare * maleRate,

    1

  );

  womenBar.style.width =
    `${womenEarnings / maximum * 100}%`;

  menBar.style.width =
    `${menEarnings / maximum * 100}%`;


  // ----------------------------------------------------------
  // DYNAMIC EDITORIAL INSIGHT
  // ----------------------------------------------------------

  let insight;

  if (percentage === 0) {

    insight =
      'No additional earnings are generated when ' +
      'no unpaid-work time is reallocated to ' +
      'paid employment.';

  } else if (Math.round(absoluteDifference) === 0) {

    insight =
      `Reallocating ${percentage}% of unpaid-work time ` +
      `to paid employment would generate approximately ` +
      `equal additional gross earnings for women and men ` +
      `over ${periodText}, under the selected assumptions.`;

  } else {

    const group =
      difference > 0 ? 'women' : 'men';

    const otherGroup =
      difference > 0 ? 'men' : 'women';

    insight =
      `If ${percentage}% of unpaid-work time were ` +
      `reallocated to paid employment, ${group} could ` +
      `potentially generate ${moneyFormat(absoluteDifference)} ` +
      `(in 2021 PPP) more in additional gross earnings ` +
      `than ${otherGroup} over ${periodText}, ` +
      `under the selected assumptions.`;

  }

  setText(
    'opportunity-insight',
    insight
  );

}


// ============================================================
// DATA INITIALIZATION
// ============================================================

async function init() {
  const select = document.getElementById('country-select');
  const error = document.getElementById('data-error');

  try {
    const response = await fetch(DATA_PATH);

    if (!response.ok) {
      throw new Error(
        `CSV request failed (${response.status}).`
      );
    }

    const records = parseCSV(await response.text());

    const required = [
      'country',
      'sex',
      ...ACTIVITIES.map(a => a.key)
    ];

    if (
      !records.length ||
      required.some(k => !(k in records[0]))
    ) {
      throw new Error(
        `Expected columns: ${required.join(', ')}.`
      );
    }

    // Parse time-use data, wage columns and reference year.
    const data = records.map(row => {
      const result = {
        country: row.country.trim(),
        sex: row.sex.trim(),
        year: (row.year || '').trim(),

        ...Object.fromEntries(
          Object.entries(row)
            .filter(([key]) =>
              /^(Elementary|Service|Professional)(?:_common)?$/i.test(key)
            )
            .map(([key, value]) => [
              key,
              value.trim() === '' ? NaN : Number(value)
            ])
        )
      };

      for (const activity of ACTIVITIES) {
        const raw = row[activity.key].trim();

        result[activity.key] =
          raw === '' ? NaN : Number(raw);
      }

      return result;
    }).filter(row =>
      row.country &&
      ['Female', 'Male'].includes(row.sex) &&
      ACTIVITIES.every(activity =>
        Number.isFinite(row[activity.key]) &&
        row[activity.key] >= 0
      )
    );

    const groups = new Map();

    for (const row of data) {
      if (!groups.has(row.country)) {
        groups.set(row.country, []);
      }

      groups.get(row.country).push(row);
    }

    const countries = [...groups]
      .filter(([, rows]) =>
        rows.filter(r => r.sex === 'Female').length === 1 &&
        rows.filter(r => r.sex === 'Male').length === 1
      )
      .map(([name]) => name)
      .sort((a, b) => a.localeCompare(b));

    if (!countries.length) {
      throw new Error(
        'No countries have a complete female/male pair.'
      );
    }

    select.replaceChildren();

    for (const country of countries) {
      const option = el('option', '', country);
      option.value = country;
      select.append(option);
    }

    select.disabled = false;

    const initial = countries.includes('Spain')
      ? 'Spain'
      : countries[0];

    select.value = initial;

    // Occupational and wage-basis controls.
    // Update Chapters 3 and 4.

    document.querySelectorAll(
      'input[name="valuation-occupation"], ' +
      'input[name="valuation-basis"]'
    ).forEach(input => {

      input.addEventListener('change', () => {

        renderValuation(select.value, data);
        renderOpportunity(select.value, data);

      });

    });

    drawLegend();
    renderCountry(initial, data);

    // Country changes update all chapters.
    select.addEventListener('change', () => {
      renderCountry(select.value, data);
    });

    // Projection period changes update Chapters 2 and 3.
    document.getElementById('period-slider')
      .addEventListener('input', () => {
        renderAccumulation(select.value, data);
        renderValuation(select.value, data);
        renderOpportunity(select.value, data);

      });

      // Chapter 4 — unpaid-work reallocation.

  document.getElementById('opportunity-slider')
  .addEventListener('input', () => {

    renderOpportunity(select.value, data);

  });

  } catch (e) {
    console.error(e);

    document.getElementById('time-chart')
      .replaceChildren();

    error.hidden = false;

    error.textContent =
      `Unable to load the data: ${e.message} ` +
      `Run the page through a local web server.`;

    select.disabled = true;
  }
}

document.addEventListener('DOMContentLoaded', init);
