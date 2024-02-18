"use strict";

let myChart = null;

const version = 1;

Chart.defaults.borderColor = '#424949';
Chart.defaults.color = '#AEB6BF';

let items = [];

let selectedItems = new Set();

let data = {};

const storeInLocalStorage = false;

function addItem(key) {
    selectedItems.add(key);
    generate();
}

function generate() {
    if (myChart !== null) {
        myChart.destroy();
    }

    let filteredData = [];

    if (selectedItems.size > 0) {
        console.time('filterDataset');
        for (const [key, val] of Object.entries(data)) {
            if (!selectedItems.has(key)) {
                continue;
            }

            const d = [];

            for (let i = 0; i < val[0].length; i++) {
                d.push({
                    x: val[0][i] * 1000, y: +(val[1][i] / 100).toFixed(2), s: val[2][i]
                });
            }

            filteredData.push({label: key, data: d, fill: false});
        }
        console.timeEnd('filterDataset');
    }

    const ctx = document.getElementById('priceGraph').getContext('2d');

    console.time('chart.js library');
    myChart = new Chart(ctx, {
        type: 'line', data: {
            datasets: filteredData
        }, options: {
            plugins: {
                legend: {
                    maxHeight: 95, display: true
                }, tooltip: {
                    callbacks: {
                        label: function (context) {
                            return [context.dataset.label + ':', context.parsed.y + '¥ (' + context.parsed.s + ' listings)'];
                        }
                    }
                }
            }, scales: {
                x: {
                    type: 'time', time: {
                        unit: 'month', tooltipFormat: 'dd-MM-yyyy'
                    }, bounds: 'ticks'
                }, y: {
                    ticks: {
                        callback: function (value) {
                            return '¥' + (+value).toLocaleString('en');
                        }
                    }, type: 'linear', beginAtZero: true
                }
            }, parsing: false, normalized: true,
        }
    });
    console.timeEnd('chart.js library');
}

async function encodeUint8ArrStreamToString(uint8ArrStream) {
    console.time('encodeUint8ArrStreamToString')

    let str = '';
    let size = 0;

    const reader = uint8ArrStream.getReader();
    while (true) {
        const {done, value} = await reader.read();

        if (done) {
            break;
        }

        console.log('chunk size:', value.length);
        size += value.length;

        for (let j = 0; j < value.length; j += 2) {
            const charCode = (value[j] << 8) | (value[j + 1] || 0);
            str += String.fromCharCode(charCode);
        }
    }

    console.timeEnd('encodeUint8ArrStreamToString')

    return [str, size];
}

async function decodeStringToUint8ArrStream(str, size, writableStream) {
    console.time('decodeStringToUint8ArrStream');

    const writer = writableStream.getWriter();

    let i = 0;

    const maxBufferSize = 1024 * 128 * 128;

    let bufferIndex = 0;
    const buffer = new Uint8Array(maxBufferSize);

    for (; i < str.length - 1; i++) {
        const char = str.charCodeAt(i);

        buffer[bufferIndex++] = char >> 8;
        buffer[bufferIndex++] = char & 0xff;

        if (bufferIndex > maxBufferSize - 5) {
            console.log('flush');
            // flush and reset buffer
            await writer.write(buffer);
            bufferIndex = 0;
        }
    }

    const finalChar = str.charCodeAt(i);
    buffer[bufferIndex++] = finalChar >> 8;
    if (i * 2 + 1 < size) {
        buffer[bufferIndex++] = finalChar & 0xff;
    }

    console.log('done');
    await writer.write(buffer);
    await writer.close();

    console.timeEnd('decodeStringToUint8ArrStream')
}

async function loadDataFromStorage() {
    console.time('loadDataFromStorage');
    const transformStream = new TransformStream(undefined, {highWaterMark: 1}, {highWaterMark: 4});

    const dec = decodeStringToUint8ArrStream(localStorage.getItem(`data-${version}`), +localStorage.getItem(`size-${version}`), transformStream.writable);

    try {
        data = await (new Response(new xzwasm.XzReadableStream(transformStream.readable))).json();
    } catch (e) {
        console.error('wtf man');
        console.error(e);
    }

    await dec;
    console.timeEnd('loadDataFromStorage');
}

async function fetchData() {
    localStorage.clear();
    const compressedRes = await fetch('price-history-weekly.json.xz');

    const streams = compressedRes.body.tee();

    const encoded = encodeUint8ArrStreamToString(streams[0]);
    const decompress = (new Response(new xzwasm.XzReadableStream(streams[1]))).json();

    return [await encoded, await decompress]
}

async function loadData() {
    console.time('loadData');

    const ov = $('#loadingOverlay');
    const cv = $('#canvasContainer');

    ov.css('display', 'block');
    cv.css('display', 'none');

    const itemRes = await fetch('items-included.json');
    items = await itemRes.json();
    $('#addItem').autocomplete({
        delay: 100, position: {
            my: 'center top+1', of: '#autocompleteAlign'
        }, select: (evnt, ui) => {
            addItem(ui.item.value);
            $('#addItem').val('');
            return false;
        }, source: (req, res) => {
            const fs = req.term.toLowerCase().split(' ').map(f => f.trim());

            const matches = [];

            for (const i of items) {
                const il = i.toLowerCase();

                if (selectedItems.has(i) || fs.some(f => !il.includes(f))) {
                    continue;
                }

                matches.push(i);

                if (matches.length === 10) {
                    break;
                }
            }

            res(matches);
        }
    });

    if (storeInLocalStorage && localStorage.getItem(`data-${version}`) !== null && localStorage.getItem(`size-${version}`) !== null) {
        try {
            await loadDataFromStorage();
            console.log('loaded data from local storage');
        } catch (e) {
            console.error(e);

            const [[str, size], d] = await fetchData();
            data = d;
            localStorage.setItem(`data-${version}`, str);
            localStorage.setItem(`size-${version}`, size.toString());
            console.log('fetched data');
        }
    } else {
        const [[str, size], d] = await fetchData();
        data = d;
        localStorage.setItem(`data-${version}`, str);
        localStorage.setItem(`size-${version}`, size.toString());
        console.log('fetched data');
    }

    ov.css('display', 'none');
    cv.css('display', 'block');

    console.timeEnd('loadData');
}

$(document).ready(async () => {
    await loadData();

    console.log(Object.entries(data)[0]);

    generate();
});
