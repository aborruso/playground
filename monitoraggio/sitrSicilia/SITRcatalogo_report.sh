#!/bin/bash

### requisiti ###
# parallel https://www.gnu.org/software/parallel/
# gdal/ogr https://gdal.org/
# jq https://github.com/stedolan/jq
# miller https://github.com/johnkerl/miller
### requisiti ###

set -x

folder="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

git pull

# crea report

echo -e "# Risposte HTTP\n" >"$folder"/../../docs/monitoraggio/sitrSicilia/report.md

mlr --c2m count -g http_code then sort -nr count "$folder"/report.csv >>"$folder"/../../docs/monitoraggio/sitrSicilia/report.md

echo -e "\n# Conteggio per IPA \n" >>"$folder"/../../docs/monitoraggio/sitrSicilia/report.md

mlr --c2m cut -f http_code,IPA then count -g http_code,IPA then reshape -s IPA,count then unsparsify then sort -f http_code "$folder"/report.csv >>"$folder"/../../docs/monitoraggio/sitrSicilia/report.md

echo -e "\n# 404\n" >>"$folder"/../../docs/monitoraggio/sitrSicilia/report.md

mlr --c2m filter -S '$http_code=="404"' then cut -f identifier,http_code,references then sort -f identifier "$folder"/report.csv >>"$folder"/../../docs/monitoraggio/sitrSicilia/report.md
