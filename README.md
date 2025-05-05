# Buff.163 CS Items Price History Archive

This repository aims to publicly archive the minimum listing price history of all(*)
Counter-Strike items from the marketplace [buff.163.com](https://buff.163.com/) starting 
from **26.07.2021** until around **19.01.2024**.

If you suspect any inconsistencies, errors or have any suggestions feel free to open an issue.

Data source provided by https://twitter.com/cantryde

Note that there's no guarantee that all the data is 100% correct.

(*) Some items are missing. See [`missing-items.txt`](./missing-items.txt)

## Demo
[This demo website](https://atalantus.github.io/buff-price-history-archive/) visualizes the data from `price-history-weekly.json.xz` using [Chart.js](https://www.chartjs.org/).

Due to some weird JSON parsing issues this website only works in Chromium-based Browsers.

**Note:** Using XZ-Compression is a bit over the top. Using a lower level (e.g. 4) Brotli-Compression instead is much faster and still
has close to the same compression ratio as XZ.

## Repository Contents
The data is provided as three compressed json files.

**price-history-raw.json.xz:**<br>
The raw data source with up to multiple price points per day.<br>
Note that since this file is 113 MB in size it is stored using [Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage).

**price-history-daily.json.xz:**<br>
One price point per day

**price-history-weekly.json.xz:**<br>
One price point per week

**price-history-weekly-2.json.xz:**<br>
One price point every second week

**price-history-monthly.json.xz:**<br>
One price point per month

### Daily/Weekly/Monthly Aggregation Algorithm
For `price-history-day.json.xz` and `price-history-month.json.xz` the raw data source is used.

The daily/weekly/monthly aggregate data is zero if all price/listing-number data points in this day/week/month are 0 or otherwise
the median of all positive price/listing-number data points in this day/week/month.

**Pseudo-Code:**
```js
aggregate = dataPoints.filter(d => d > 0).length == 0 ? 0 : dataPoints.filter(d => d > 0).median()
```
## File/Data Format
The files are compressed using [XZ-Compression](https://en.wikipedia.org/wiki/XZ_Utils).

You can decompress the files using for example the command: `unxz -v "[file name]"`.

The resulting json file stores one property per item with the item's name as key.
Each property stores an array consisting of three arrays:

- The first inner array stores the [unix time](https://en.wikipedia.org/wiki/Unix_time) in **seconds** per price point
- The second inner array stores the price **\* 100** in CNY (¥) as an integer per price point
- The third inner array stores the total number of listings per price point <br>(Note that this data is only available for price points after 25.01.2023 and entries for previous dates will be 0.)
### Example
The following example stores 2 price points for the "AK-47 | Rat Rod (Minimal Wear)", 
where the first price point from 06.08.2021 shows a minimum listing price of 18.80 ¥
for an unknown amount of listings (the price point's date is before 25.01.2023).
The second price point from 19.01.2024 shows a minimum listing price of 26.27 ¥
for 589 listings.

```json
{
  "AK-47 | Rat Rod (Minimal Wear)": [
    [1628232191, 1705675682],
    [1880, 2627], 
    [0, 589]
  ]
}
```
