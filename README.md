# Buff.163 CS Items Price History Archive

This repository aims to publicly archive the minimum listing price history of all(*)
Counter-Strike items on the marketplace [buff.163.com](https://buff.163.com/) starting 
from **26.07.2021** until around **19.01.2024**.

If you suspect any inconsistencies, errors or have any suggestions feel free to open an issue.

Data source provided by https://twitter.com/cantryde

Note that there's no guarantee that all the data is 100% correct.

(*) Some items are missing. See [`missing-items.txt`](https://github.com/atalantus/buff-price-history-archive/blob/main/missing-items.txt)

## Demo
[This demo website](https://atalantus.github.io/buff-price-history-archive/) visualizes the data from `price-history-weekly.json.xz` using [Chart.js](https://www.chartjs.org/).

**Note:** Using XZ-Compression is a bit over the top. Using a lower level (e.g. 4) Brotli-Compression instead is much faster and still
has close to the same compression ratio as XZ.
