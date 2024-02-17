let myChart = null;

const version = 1;

Chart.defaults.borderColor = '#424949';
Chart.defaults.color = '#AEB6BF';

let filter = "Aquamarine Revenge";

let data = {};

function generate() {
    if (myChart !== null) {
        myChart.destroy();
    }

    let filteredData = [];

    for (const [key, val] of Object.entries(data)) {
        if (!key.includes(filter)) {
            continue;
        }

        const d = [];

        for (let i = 0; i < val[0].length; i++) {
            d.push({
                x: val[0][i] * 1000,
                y: +(val[1][i] / 100).toFixed(2),
                s: val[2][i]
            });
        }

        filteredData.push({label: key, data: d, fill: false});
    }

    console.log(filteredData);

    const ctx = document.getElementById('priceGraph').getContext('2d');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: filteredData
        },
        options: {
            plugins: {
                legend: {
                    maxHeight: 180,
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return [context.dataset.label + ':', context.parsed.y + '¥ (' + context.parsed.s + ' listings)'];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'dd-MM-yyyy'
                    },
                    bounds: 'ticks'
                },
                y: {
                    ticks: {
                        callback: function (value) {
                            return '¥' + (+value).toLocaleString('en');
                        }
                    },
                    type: 'linear',
                    beginAtZero: true
                }
            },
            parsing: false,
            normalized: true
        }
    });
}

function encodeUint8ArrToString(uint8Arr) {
    const arr = new Uint16Array(Math.ceil(uint8Arr.length / 2));

    let i = 0;
    for (; i < uint8Arr.length - 1; i++) {
        arr[i / 2] = (uint8Arr[i] << 8) ^ (uint8Arr[++i] & 0xff);
    }

    arr[i / 2] =
        (uint8Arr[i] << 8) ^
        (uint8Arr.length % 2 === 0 ? uint8Arr[i + 1] : 0 & 0xff);

    console.log(arr);

    return [String.fromCharCode(...arr), uint8Arr.length];
}

function decodeStringToUint8Arr(str, size) {
    const arr = new Uint8Array(size);

    let i = 0;

    for (; i < str.length - 1; i++) {
        const char = str.charCodeAt(i);
        arr[i * 2] = char >> 8;
        arr[i * 2 + 1] = char & 0xff;
    }

    const finalChar = str.charCodeAt(i);
    arr[i * 2] = finalChar >> 8;
    if (i * 2 + 1 < size) {
        arr[i * 2 + 1] = finalChar & 0xff;
    }

    return arr;
}

async function loadData() {
    const ov = $('#loadingOverlay');
    const cv = $('#canvasContainer');

    ov.css('display', 'block');
    cv.css('display', 'none');

    // fetch data
    const compressedRes = await fetch(`price-history-weekly.json.xz`);

    const decompressedRes = new Response(new xzwasm.XzReadableStream(compressedRes.body));

    data = await decompressedRes.json();

    ov.css('display', 'none');
    cv.css('display', 'block');
}

$(document).ready(async () => {
    await loadData();

    generate();
});
